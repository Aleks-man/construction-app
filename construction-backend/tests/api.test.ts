import bcrypt from "bcrypt";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/prisma";

const testEmailDomain = "@api.test";

describe("API", () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it("logs in and returns the current user", async () => {
    const user = await createTestUser("auth-admin", "ADMIN");

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: testPassword })
      .expect(200);

    expect(loginResponse.body.token).toEqual(expect.any(String));
    expect(loginResponse.body.user).toMatchObject({
      id: user.id,
      email: user.email,
      role: "ADMIN",
    });
    expect(loginResponse.body.user.password).toBeUndefined();

    const meResponse = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(meResponse.body).toMatchObject({
      id: user.id,
      email: user.email,
      role: "ADMIN",
    });
  });

  it("rejects duplicate project names", async () => {
    const adminToken = await loginAs(await createTestUser("project-admin", "ADMIN"));

    await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "API Test Duplicate Project" })
      .expect(201);

    const duplicateResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "api test duplicate project" })
      .expect(409);

    expect(duplicateResponse.body).toEqual({
      message: "Project with this name already exists",
    });
  });

  it("records project activity", async () => {
    const admin = await createTestUser("activity-admin", "ADMIN");
    const adminToken = await loginAs(admin);

    const projectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "API Test Activity Project" })
      .expect(201);

    const activityResponse = await request(app)
      .get(`/projects/${projectResponse.body.id}/activity`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(activityResponse.body[0]).toMatchObject({
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: projectResponse.body.id,
      message: 'created project "API Test Activity Project"',
      user: {
        id: admin.id,
        email: admin.email,
        role: "ADMIN",
      },
    });
  });

  it("creates users with contact details", async () => {
    const adminToken = await loginAs(await createTestUser("contact-admin", "ADMIN"));

    const createUserResponse = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: `contact-worker-${Date.now()}${testEmailDomain}`,
        password: testPassword,
        firstName: "Alex",
        lastName: "Worker",
        phone: "+1 555 0100",
        role: "WORKER",
      })
      .expect(201);

    expect(createUserResponse.body).toMatchObject({
      email: expect.stringMatching(testEmailDomain),
      firstName: "Alex",
      lastName: "Worker",
      phone: "+1 555 0100",
      role: "WORKER",
    });
    expect(createUserResponse.body.password).toBeUndefined();
  });

  it("allows managers to create only worker users", async () => {
    const managerToken = await loginAs(await createTestUser("contact-manager", "MANAGER"));

    await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        email: `manager-created-worker-${Date.now()}${testEmailDomain}`,
        password: testPassword,
        firstName: "Managed",
        lastName: "Worker",
        role: "WORKER",
      })
      .expect(201);

    await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        email: `manager-created-manager-${Date.now()}${testEmailDomain}`,
        password: testPassword,
        firstName: "Wrong",
        lastName: "Role",
        role: "MANAGER",
      })
      .expect(403);
  });

  it("allows managers to add only worker users to projects", async () => {
    const admin = await createTestUser("project-member-admin", "ADMIN");
    const manager = await createTestUser("project-member-manager", "MANAGER");
    const worker = await createTestUser("project-member-worker", "WORKER");
    const managerToken = await loginAs(manager);

    const project = await prisma.project.create({
      data: {
        name: "API Test Manager Member Permissions",
        users: {
          create: {
            userId: manager.id,
          },
        },
      },
    });

    await request(app)
      .post("/project-users")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ projectId: project.id, userId: worker.id })
      .expect(201);

    await request(app)
      .post("/project-users")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ projectId: project.id, userId: admin.id })
      .expect(403);
  });

  it("allows assigned workers to update only their own task status", async () => {
    const adminToken = await loginAs(await createTestUser("task-admin", "ADMIN"));
    const assignedWorker = await createTestUser("assigned-worker", "WORKER");
    const otherWorker = await createTestUser("other-worker", "WORKER");
    const assignedWorkerToken = await loginAs(assignedWorker);
    const otherWorkerToken = await loginAs(otherWorker);

    const project = await prisma.project.create({
      data: {
        name: "API Test Worker Permissions",
        users: {
          create: [
            { userId: assignedWorker.id },
            { userId: otherWorker.id },
          ],
        },
        stages: {
          create: {
            name: "API Test Stage",
          },
        },
      },
      include: {
        stages: true,
      },
    });

    const createTaskResponse = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "API Test Assigned Task",
        stageId: project.stages[0].id,
        assigneeId: assignedWorker.id,
      })
      .expect(201);

    const taskId = createTaskResponse.body.id as number;

    await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${otherWorkerToken}`)
      .send({ status: "DONE" })
      .expect(403);

    const updateResponse = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${assignedWorkerToken}`)
      .send({ status: "IN_PROGRESS" })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: taskId,
      status: "IN_PROGRESS",
      assigneeId: assignedWorker.id,
    });
  });

  it("allows admins to delete users without deleting assigned tasks", async () => {
    const admin = await createTestUser("users-admin", "ADMIN");
    const worker = await createTestUser("users-worker", "WORKER");
    const adminToken = await loginAs(admin);

    const project = await prisma.project.create({
      data: {
        name: "API Test User Deletion",
        users: {
          create: {
            userId: worker.id,
          },
        },
        stages: {
          create: {
            name: "API Test User Stage",
            tasks: {
              create: {
                title: "API Test User Task",
                assigneeId: worker.id,
              },
            },
          },
        },
      },
      include: {
        stages: {
          include: {
            tasks: true,
          },
        },
      },
    });

    await request(app)
      .delete(`/users/${admin.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(403);

    await request(app)
      .delete(`/users/${worker.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const deletedWorker = await prisma.user.findUnique({
      where: { id: worker.id },
    });
    const projectMember = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: {
          userId: worker.id,
          projectId: project.id,
        },
      },
    });
    const task = await prisma.task.findUnique({
      where: { id: project.stages[0].tasks[0].id },
    });

    expect(deletedWorker).toBeNull();
    expect(projectMember).toBeNull();
    expect(task?.assigneeId).toBeNull();
  });
});

const testPassword = "test1234";

async function createTestUser(name: string, role: "ADMIN" | "MANAGER" | "WORKER") {
  const email = `${name}-${Date.now()}${testEmailDomain}`;
  const password = await bcrypt.hash(testPassword, 10);

  return prisma.user.create({
    data: {
      email,
      password,
      role,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
}

async function loginAs(user: { email: string }) {
  const response = await request(app)
    .post("/auth/login")
    .send({ email: user.email, password: testPassword })
    .expect(200);

  return response.body.token as string;
}

async function cleanupTestData() {
  await prisma.task.deleteMany({
    where: {
      OR: [
        {
          stage: {
            project: {
              name: {
                startsWith: "API Test",
              },
            },
          },
        },
        {
          assignee: {
            email: {
              endsWith: testEmailDomain,
            },
          },
        },
      ],
    },
  });

  await prisma.stage.deleteMany({
    where: {
      project: {
        name: {
          startsWith: "API Test",
        },
      },
    },
  });

  await prisma.projectUser.deleteMany({
    where: {
      OR: [
        {
          project: {
            name: {
              startsWith: "API Test",
            },
          },
        },
        {
          user: {
            email: {
              endsWith: testEmailDomain,
            },
          },
        },
      ],
    },
  });

  await prisma.project.deleteMany({
    where: {
      name: {
        startsWith: "API Test",
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: testEmailDomain,
      },
    },
  });
}

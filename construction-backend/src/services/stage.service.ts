import { badRequest, notFound } from "../errors/http-error";
import { projectRepository } from "../repositories/project.repository";
import { stageRepository } from "../repositories/stage.repository";
import { activityService, type ActivityActor } from "./activity.service";
import { ensureActorCanManageProject } from "./project-permission.service";

export const stageService = {
  async createStage(data: { name: string; projectId: number }, actor?: ActivityActor) {
    await ensureProjectExists(data.projectId);
    await ensureActorCanManageProject(data.projectId, actor);

    const stage = await stageRepository.create({
      name: normalizeName(data.name),
      projectId: data.projectId,
    });

    await activityService.record({
      action: "STAGE_CREATED",
      entityType: "STAGE",
      entityId: stage.id,
      message: `created stage "${stage.name}"`,
      projectId: stage.projectId,
      actor,
    });

    return stage;
  },

  getStages(projectId?: number) {
    return stageRepository.findAll(projectId);
  },

  async getStage(id: number) {
    const stage = await stageRepository.findById(id);

    if (!stage) {
      throw notFound("Stage not found");
    }

    return stage;
  },

  async updateStage(
    id: number,
    data: Partial<{ name: string; projectId: number }>,
    actor?: ActivityActor,
  ) {
    const existingStage = await this.getStage(id);
    await ensureActorCanManageProject(existingStage.projectId, actor);

    const updateData: Partial<{ name: string; projectId: number }> = {};

    if (data.name !== undefined) {
      updateData.name = normalizeName(data.name);
    }

    if (data.projectId !== undefined) {
      await ensureProjectExists(data.projectId);
      await ensureActorCanManageProject(data.projectId, actor);
      updateData.projectId = data.projectId;
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest("At least one field is required");
    }

    const stage = await stageRepository.updateById(id, updateData);

    if (updateData.name && updateData.name !== existingStage.name) {
      await activityService.record({
        action: "STAGE_UPDATED",
        entityType: "STAGE",
        entityId: stage.id,
        message: `renamed stage from "${existingStage.name}" to "${stage.name}"`,
        projectId: stage.projectId,
        actor,
      });
    }

    return stage;
  },

  async deleteStage(id: number, actor?: ActivityActor) {
    const stage = await this.getStage(id);
    await ensureActorCanManageProject(stage.projectId, actor);

    await activityService.record({
      action: "STAGE_DELETED",
      entityType: "STAGE",
      entityId: stage.id,
      message: `deleted stage "${stage.name}"`,
      projectId: stage.projectId,
      actor,
    });

    return stageRepository.deleteById(id);
  },
};

function normalizeName(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw badRequest("name is required");
  }

  return trimmedName;
}

async function ensureProjectExists(projectId: number) {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw notFound("Project not found");
  }
}

import { activityRepository } from "../repositories/activity.repository";
import { projectRepository } from "../repositories/project.repository";
import { notFound } from "../errors/http-error";

export type ActivityActor = {
  id: number;
  email?: string;
  role: string;
};

export const activityService = {
  async getProjectActivity(projectId: number) {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw notFound("Project not found");
    }

    return activityRepository.findByProjectId(projectId);
  },

  record(data: {
    action: string;
    entityType: string;
    entityId?: number | null;
    message: string;
    projectId: number;
    actor?: ActivityActor;
  }) {
    return activityRepository.create({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      message: data.message,
      projectId: data.projectId,
      userId: data.actor?.id,
    });
  },
};

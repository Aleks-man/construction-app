import { badRequest, notFound } from "../errors/http-error";
import { projectRepository } from "../repositories/project.repository";
import { stageRepository } from "../repositories/stage.repository";

export const stageService = {
  async createStage(data: { name: string; projectId: number }) {
    await ensureProjectExists(data.projectId);

    return stageRepository.create({
      name: normalizeName(data.name),
      projectId: data.projectId,
    });
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

  async updateStage(id: number, data: Partial<{ name: string; projectId: number }>) {
    await this.getStage(id);

    const updateData: Partial<{ name: string; projectId: number }> = {};

    if (data.name !== undefined) {
      updateData.name = normalizeName(data.name);
    }

    if (data.projectId !== undefined) {
      await ensureProjectExists(data.projectId);
      updateData.projectId = data.projectId;
    }

    if (Object.keys(updateData).length === 0) {
      throw badRequest("At least one field is required");
    }

    return stageRepository.updateById(id, updateData);
  },

  async deleteStage(id: number) {
    await this.getStage(id);

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

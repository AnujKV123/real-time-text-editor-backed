import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Team } from "../models/team.model";
import { ApiResponse } from "../utils/ApiResponse";

const createTeam = asyncHandler(async (req, res) => {
  const { name, members, documents, owner } = req.body;
  if (!name || !members || !documents || !owner) {
    throw new ApiError(400, "name, members, documents, and owner is required");
  }
  const team = await Team.create({ name, documents, members, owner });

  if (!team) {
    throw new ApiError(400, "Team not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, team, "Team created successfully"));
});

const getTeams = asyncHandler(async (req, res) => {
  const { owner } = req.query;
  const teams = await Team.find({
    $or: [{ owner: owner }, { "members.email": owner }],
  });

  if (!teams) {
    throw new ApiError(404, "Teams not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, teams, "Teams fetched successfully"));
});

const getTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const team = await Team.findById(id);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, team, "Team fetched successfully"));
});

const deleteTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const team = await Team.findByIdAndDelete(id);

  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, team, "Team deleted successfully"));
});

export { createTeam, getTeams, getTeam, deleteTeam };

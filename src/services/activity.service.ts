import { apiClient } from "./api";
import {
  activitySchema,
  activityDetailSchema,
  feedbackSchema,
} from "./contracts";
export const activityService = {
  async getRecommendedActivities(id: string) {
    return activitySchema
      .array()
      .parse(
        (
          await apiClient.get(
            "/api/v1/patients/" + id + "/activities/recommended",
          )
        ).data,
      );
  },
  async getActivity(id: string, activityId: string) {
    return activityDetailSchema.parse(
      (
        await apiClient.get(
          "/api/v1/patients/" +
            id +
            "/activities/" +
            encodeURIComponent(activityId),
        )
      ).data,
    );
  },
  async submit(
    id: string,
    activityId: string,
    payload: {
      result: "completed" | "skipped" | "liked";
      response: string[];
      completionTime: number;
    },
  ) {
    return feedbackSchema.parse(
      (
        await apiClient.post(
          "/api/v1/patients/" +
            id +
            "/activities/" +
            encodeURIComponent(activityId) +
            "/result",
          payload,
        )
      ).data,
    );
  },
};

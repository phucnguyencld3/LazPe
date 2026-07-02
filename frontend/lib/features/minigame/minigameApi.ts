const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";

export interface LuckyWheelStatusResponse {
  success: boolean;
  hasSpunToday: boolean;
  spinsRemaining: number;
}

export interface LuckyWheelSpinResponse {
  success: boolean;
  wonPoints: number;
  rewardName: string;
  message: string;
}

export const getLuckyWheelStatus = async (token: string): Promise<LuckyWheelStatusResponse> => {
  const res = await fetch(`${API_URL}/Minigame/lucky-wheel/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch lucky wheel status");
  }

  return await res.json();
};

export const spinLuckyWheel = async (token: string): Promise<LuckyWheelSpinResponse> => {
  const res = await fetch(`${API_URL}/Minigame/lucky-wheel/spin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    if (errorData && errorData.message) {
      throw new Error(errorData.message);
    }
    throw new Error("Failed to spin lucky wheel");
  }

  return await res.json();
};

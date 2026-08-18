import api from "./api";

const getMyProfile = async () => {
  const { data } = await api.get("/profile/me");
  return data.data;
};

const updateApiKeys = async (keys) => {
  const { data } = await api.put("/profile/keys", keys);
  return data;
};

const getLlmUsage = async () => {
  const { data } = await api.get("/profile/usage");
  return data.data;
};

export default { getMyProfile, updateApiKeys, getLlmUsage };
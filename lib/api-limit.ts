import { auth } from "@clerk/nextjs";
import prismadb from "./prismadb";
import { MAX_FREE_COUNTS } from "@/constants";

export const increaseApiLimit = async () => {
  const { userId } = auth();
  if (!userId) {
    return;
  }
  console.log(userId);
  const userApiLimit = await prismadb.userApiLimit.findUnique({
    where: { userId: userId },
  });
  console.log(userApiLimit);
  if (userApiLimit) {
    await prismadb.userApiLimit.update({
      where: { userId: userId },
      data: { count: userApiLimit.count + 1 },
    });
    console.log(userApiLimit);
  } else {
    await prismadb.userApiLimit.create({
      data: { userId: userId, count: 1 },
    });
  }
};
export const checkApiLimit = async () => {
  const { userId } = auth();
  console.log(userId);
  if (!userId) {
    return false;
  }
  const apiLimit = await prismadb.userApiLimit.findUnique({
    where: {
      userId: userId,
    },
  });
  console.log(apiLimit);
  if (!apiLimit || apiLimit.count < MAX_FREE_COUNTS) {
    return true;
  } else {
    return false;
  }
};
export const getApiLimitCount = async () => {
  const { userId } = auth();
  if (!userId) {
    return 0;
  }
  const limit = await prismadb.userApiLimit.findUnique({ where: { userId } });
  console.log(limit);
  if (!limit) {
    return 0;
  }
  return limit.count;
};

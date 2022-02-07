import type { NextApiRequest, NextApiResponse } from "next";

type Post = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Post>
) {
  res.status(200).json({ message: "hey" });
}

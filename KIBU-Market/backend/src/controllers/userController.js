import Conversation from "../models/Conversation.js";

export async function getMyDashboard(req, res) {
  await req.user.populate({
    path: "savedListings",
    populate: {
      path: "seller",
      select: "name email avatar phone university",
    },
  });

  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate("product", "title price images status location")
    .populate("buyer seller participants", "name email avatar phone university")
    .sort({ updatedAt: -1 });

  res.json({
    user: req.user,
    savedListings: req.user.savedListings,
    conversations,
  });
}
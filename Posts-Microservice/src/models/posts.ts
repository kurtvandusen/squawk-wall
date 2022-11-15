import { Schema, model } from "mongoose";

interface Posts {
    post: string;
    postId: string;
}

const schema = new Schema<Posts>({
    post: { type: String, required: true },
    postId: { type: String, required: true }
});

const PostsModel = model<Posts>("Posts", schema);

export default PostsModel;
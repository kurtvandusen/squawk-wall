import { Schema, model } from "mongoose";


interface Comments {
    postId: string;
    comments: [{ comment: string, commentId: string }];
}

const schema = new Schema<Comments>({
    postId: { type: String, required: true },
    comments: [{ comment: String, commentId: String }]
});

const CommentsModel = model<Comments>("Comments", schema);

export default CommentsModel;
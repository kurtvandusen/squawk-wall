import { Schema, model } from "mongoose";


interface Query {
    post: string;
    postId: string;
    comments: [{ comment: string, commentId: string }];
}

const schema = new Schema<Query>({
    post: { type: String, required: true },
    postId: { type: String, required: true },
    comments: { type: [{ comment: String, commentId: String }], required: true }
});

const QueryModel = model<Query>("Query", schema);

export default QueryModel;
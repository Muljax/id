import idRoute from "./:id";
import postRoute from "./post";

const route = postRoute.route("/:id", idRoute);

export default route;

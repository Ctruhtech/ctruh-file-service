import client from "./cosmosClient";
const databaseId = "ctruh_scene_services";
const containerId = "objects";

const objectsContainer = client.database(databaseId).container(containerId);

export default objectsContainer;


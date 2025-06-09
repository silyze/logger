import { createJsonLogger } from "./lib";

const logger = createJsonLogger((json) => console.log(json));
const exampleScope = logger.createScope("example");

exampleScope.log("info", "example area", "This is an example message", {
  key: "value",
});

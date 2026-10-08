import app from "./app";
import { config } from "./app/config";

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`CivicFlow server is running on http://localhost:${PORT}`);
});


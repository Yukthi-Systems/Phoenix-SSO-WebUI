#!/bin/sh

# Line below ensures we can write to the directory
cd /app

# Recreate the config file
rm -rf ./dist/env-config.js
touch ./dist/env-config.js

# Add assignment
echo "window._env_ = {" >> ./dist/env-config.js

# Read specific variables. Add any others you need here.
# No defaults — these must be provided at runtime, or the app will fail to boot.
echo "  VITE_API_URL: \"${VITE_API_URL}\"," >> ./dist/env-config.js
echo "  VITE_SSO_URL: \"${VITE_SSO_URL}\"," >> ./dist/env-config.js
echo "  VITE_FORGOT_PASSWORD_URL: \"${VITE_FORGOT_PASSWORD_URL}\"," >> ./dist/env-config.js



echo "}" >> ./dist/env-config.js

# Execute the passed command (starts the server)
exec "$@"
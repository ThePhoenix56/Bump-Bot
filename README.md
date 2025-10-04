# Bump-Bot
A simple bumping bot for automatically bumping Discord servers on Disboard. Done using simple HTTP POST requests made to the Discord API.
## Installation
1. Clone the repository as usual (using git or downloading the ZIP)
2. Install the required npm dependencies: electron (IMPORTANT)
_If the command doesn't work, make sure npm is installed on the computer and that npm is initiated in the directory by doing npm install._
3. To run the application, git bash into the directory (or open a terminal and navigate to the directory) and run **npm start .**
_Make sure the console stays open for as long as the program is running!_

Any errors and such for debugging will be available in the console.

## Configuration
The following files must be configured in order for the bot to function correctly:
### channels.txt
This will contain the channel IDs where the bump commands will be sent. Make sure the tokens & the Disboard bot have access to this channel, otherwise it will return a 403. One channel per row.
### token.txt
This is where the discord tokens are put in.
### servers.txt
Server IDs, one server per row. For obvious reasons, the aforementioned channels should be in these servers.

This project is currently not maintained on a regular basis, feel free to fork. Any issues that open up will be addressed in due time.

//Phoenix56

require('dotenv').config();

const Launchpad = require('launchpad-mini');
const OBSWebSocket = require('obs-websocket-js');
const { getButtonsSet } = require('./utils');
const { Buttons, Colors } = Launchpad;

const obs = new OBSWebSocket();
const launchpad = new Launchpad();

const run = async (obsWebsocketHostname, obsWebsocketPort, obsWebsocketPassword) => {
  obsWebsocketHostname = obsWebsocketHostname || 'localhost';
  obsWebsocketPort = obsWebsocketPort || 4444;

  const launchpadConnection = launchpad.connect();
  const obsConnection = obs.connect({
    address: `${obsWebsocketHostname}:${obsWebsocketPort}`,
    password: obsWebsocketPassword,
  });

  try {
    await Promise.all([launchpadConnection, obsConnection]);
    console.log('Connected to Launchpad and OBS');
    console.log('Press [Control]+[C] to exit');
  } catch (err) {
    console.error(`${err.error ? 'OBS' : 'Launchpad'} Error: ${err.error || err}`);
    process.exit(1);
  }

  await launchpad.reset();
  await launchpad.setColors([Buttons.Automap[2], Buttons.Automap[3]].map((key) => [key[0], key[1], Colors.amber]));

  let lastKnownActiveScene;

  const sceneNames = (await obs.send('GetSceneList')).scenes
    .slice(0, 8)
    .map((scene) => scene.name)
    .filter((name) => name.indexOf('group:') !== 0 && name.indexOf('---') !== 0);

  const updateActveScene = (activeSceneName) => {
    lastKnownActiveScene = activeSceneName;

    launchpad.setColors(
      sceneNames.map((sceneName, y) => [8, y, sceneName === activeSceneName ? Colors.green : Colors.red])
    );
  };

  obs.on('SwitchScenes', (data) => updateActveScene(data.sceneName));
  await updateActveScene((await obs.send('GetCurrentScene')).name);

  const requestActiveScene = (sceneName) => {
    if (!sceneName) {
      return;
    }

    if (sceneName !== lastKnownActiveScene) {
      const sceneKey = Buttons.Scene[sceneNames.indexOf(sceneName)];

      launchpad.col(launchpad.yellow, sceneKey);
      obs.send('SetCurrentScene', {
        'scene-name': sceneName,
      });
    }
  };

  launchpad.on('key', (key) => {
    if (!key.pressed) {
      return;
    }

    switch (getButtonsSet(key)) {
      case Buttons.Scene:
        requestActiveScene(sceneNames[key.y]);
        break;
      case Buttons.Automap:
        if (key.x === 2) {
          requestActiveScene(
            sceneNames[(sceneNames.length + (sceneNames.indexOf(lastKnownActiveScene) - 1)) % sceneNames.length]
          );
        } else if (key.x === 3) {
          requestActiveScene(sceneNames[(sceneNames.indexOf(lastKnownActiveScene) + 1) % sceneNames.length]);
        }
        break;
      default:
        // Buttons.Grid:
        break;
    }
  });
};

process.on('SIGINT', async () => {
  await launchpad.reset();
  await Promise.all([launchpad.disconnect(), obs.disconnect()]);
  console.log('\nDisconnected from Launchpad and OBS');
  process.exit(0);
});

if (module.parent === null) {
  const { OBS_WEBSOCKET_HOSTNAME, OBS_WEBSOCKET_PORT, OBS_WEBSOCKET_PASSWORD } = process.env;

  run(OBS_WEBSOCKET_HOSTNAME, OBS_WEBSOCKET_PORT, OBS_WEBSOCKET_PASSWORD || undefined);
}

module.exports.run = run;

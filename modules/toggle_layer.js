import fs from 'fs';

function readJsonFileSync(fileName, encoding = 'utf8') {
  const filepath = process.env.NODE_PATH + '/' + fileName;

  try {
    const file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }

  return {};
}

function writeJsonFileSync(fileName, content, encoding = 'utf8') {
  let isSucess = true;
  const filepath = process.env.NODE_PATH + '/' + fileName;

  try {
    fs.writeFileSync(filepath, content, { encoding, mode: 0o755 });
  } catch (error) {
    isSucess = false;
    console.log('An error has occurred ', error);
  }

  return isSucess;
}

function saveLayer(req, res, key) {
  const jsonBody = req.body;

  try {
    const layerContent = readJsonFileSync('active-layers.json');
    layerContent[key] = jsonBody;

    const isSuccess = writeJsonFileSync('active-layers.json', JSON.stringify(layerContent));
    if (!isSuccess) {
      throw new Error('Unable to save settings');
    }

    return res.status(200).json({ message: 'Active Layers Saved' });

  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong while trying to save active layers' });
  }
}

function getLayer(req, res, key) {
  let obj = null;

  try {
    obj = readJsonFileSync('active-layers.json');

    if (obj[key]) {
      obj = obj[key];
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Something went wrong while trying to get active layers' });
  }

  return res.status(200).json(obj);
}

function handleSaveLayer(req, res, key) {
  const jsonKey = (req.param.key || 'cfi') + key;

  if (key) {
    return saveLayer(req, res, jsonKey);
  }

  return res.end();
}

function handleGetLayer(req, res, key) {
  const jsonKey = (req.param.key || 'cfi') + key;

  if (key) {
    return getLayer(req, res, jsonKey);
  }

  return res.end();
}


const ToggleLayer = {
  readJsonFileSync,
  writeJsonFileSync,
  handleGetLayer,
  handleSaveLayer,
}

// export custom middleware
export default ToggleLayer;
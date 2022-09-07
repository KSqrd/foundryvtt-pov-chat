const povDiv = document.createElement('div');
povDiv.classList.add('kitty-pov-chat--main');
povDiv.classList.add('flexcol');
povDiv.innerHTML = (`<div></div><div class='kitty-pov-chat--menu'></div>`);
const povMenu = povDiv.lastChild;
povMenu.innerHTML = `<img class='kitty-pov-chat--portrait' /><select class='kitty-pov-chat--select' value=''></select>`;
let povPortrait = povMenu.childNodes[0];
let povSelect = povMenu.childNodes[1];
let povToken;
let povAuto;

Hooks.once('renderChatLog', () => {
  const chatControls = document.getElementById('chat-controls');
  chatControls.parentNode.insertBefore(povDiv, chatControls);

  PopulateOptions(true);
});

Hooks.on('chatMessage', (tab, message, chatData) => {
  const user = game.users.current;
  if (!povAuto.checked) {
    const value = povSelect.value ? JSON.parse(povSelect.value) : {};
    chatData.speaker.actor = value.actor;
    chatData.speaker.alias = value.alias || user.name;
    chatData.speaker.token = value.token;
  }
});

Hooks.on('canvasReady', (canvas) => {
  PopulateOptions(true);
});

Hooks.on('updateActor', (actor, data, options, user) => {
  if (data.ownership) {
    PopulateOptions(false);
  }
});

Hooks.on(`createToken`, (token, options, userId) => {
  PopulateOptions(false);
});

Hooks.on(`deleteToken`, (token, options, userId) => {
  PopulateOptions(false);
});

Hooks.on('controlToken', (placeable, isControlling) => {
  const token = placeable.document;
  UpdatePoVSelection(token.id, isControlling);
});

function UpdatePoVSelection(tokenId, isControlling) {
  if (povAuto.checked) {
    const select = isControlling ? tokenId : '';
    const option = [...povSelect.childNodes].find((opt) => {
      const value = opt.value ? JSON.parse(opt.value) : {};
      return value.token === select;
    }) || povSelect.lastChild;
    option.selected = true;
    UpdatePortrait();
  }
}

function ConfigureSettings() {
  povDiv.firstChild.innerHTML = game.i18n.format('kitty-pov-chat.header');

  povMenu.appendChild(document.createElement('div'));
  povMenu.lastChild.classList.add('flexcol');
  const textAuto = game.i18n.format('kitty-pov-chat.enableAuto');
  const hintAuto = game.i18n.format('kitty-pov-chat.enableAutoHint');
  povMenu.lastChild.innerHTML = `<div>${textAuto}</div><input type='checkbox' title='${hintAuto}' checked />`;
  povAuto = povMenu.lastChild.lastChild;
  povAuto.addEventListener('change', () => {
    const speaker = ChatMessage.getSpeaker();
    if (povAuto.checked) {
      UpdatePoVSelection(speaker.token, true);
    }
  });
}
Hooks.on('i18nInit', ConfigureSettings);

function UpdatePortrait() {
  const img = document.createElement('img');
  img.classList.add('kitty-pov-chat--portrait');
  const selected = povSelect.value ? JSON.parse(povSelect.value) : {};
  const src = selected.portrait || game.users.current.avatar;
  img.src = src;
  povMenu.replaceChild(img, povPortrait);
  povPortrait = img;
  if (selected.token && selected.scene === game.scenes.current.id) {
    povPortrait.addEventListener('click', () => {
      PanToToken(selected.token);
    });
  }
}

function PopulateOptions(sceneHasChanged) {
  const user = game.users.current;
  let scene = game.scenes.get(user.viewedScene);
  scene = scene || game.scenes.current;

  const tokens = scene.tokens.filter((token) => {
    const actor = game.actors.get(token.actorId);
    if (actor) {
      const owner = actor.ownership && (actor.ownership[user.id] || actor.ownership.default);
      return owner === 3;
    }
    return false;
  });

  const select = document.createElement('select');
  select.classList.add('kitty-pov-chat--select');

  tokens.forEach((token) => {
    const tokenId = token.id;
    const { portrait, name } = GetActorInfo(token);
    const option = document.createElement('option');
    option.classList.add('flexrow');
    option.innerHTML = `${name}`;
    const value = {
      scene: scene.id,
      actor: token.actorId,
      token: token.id,
      alias: name,
      portrait
    };
    option.value = JSON.stringify(value);
    option.selected = !sceneHasChanged && (povSelect.value === option.value);
    select.appendChild(option);
  });
  const selectedOption = [...select.childNodes].find((opt) => opt.selected);
  const option = document.createElement('option');
  option.classList.add('flexrow');
  option.innerHTML = `${user.name}`;
  option.value = '';
  option.selected = !selectedOption;
  select.appendChild(option);

  povSelect.parentNode.replaceChild(select, povSelect);
  povSelect = select;
  povSelect.addEventListener('change', UpdatePortrait);
  UpdatePortrait();
}

function GetActorInfo(token) {
  const info = {};
  const actor = game.actors.get(token.actorId);
  if (actor) {
    info.portrait = actor && actor.img;
    info.name = actor.name;
  } else {
    info.portrait = token.texture.src;
    info.name = token.name;
  }
  return info;
}

function PanToToken(tokenId) {
  const scene = game.scenes.current;
  const token = scene.tokens.get(tokenId);
  if (token) {
    const scale = Math.max(1, canvas.stage.scale.x);
    canvas.animatePan({ x: token.x, y: token.y, scale, duration: 1000 });
  }
}
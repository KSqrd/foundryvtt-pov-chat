Hooks.on('renderChatMessage', (message, html, speakerInfo) => {
  const { portrait, name } = GetActorInfo(speakerInfo);
  const speaker = speakerInfo.message.speaker;
  const tokenId = speaker && speaker.token;
  if (portrait) {
    const parent = html[0];
    const children = [...parent.childNodes];
    const div = document.createElement('div');
    div.classList.add('flexcol');
    parent.classList.remove('flexcol');
    parent.classList.add('flexrow');
    children.forEach((child) => {
      parent.removeChild(child);
      div.appendChild(child);
    });

    const img = document.createElement('img');
    img.src = portrait;
    img.title = name;
    img.classList.add('kitty-pov-chat--portrait');
    parent.appendChild(img);
    parent.appendChild(div);
    if (tokenId) {
      img.addEventListener('click', () => {
        PanToToken(tokenId);
      });
    }
  }
});

function GetActorInfo(speakerInfo) {
  const info = {};
  const speaker = speakerInfo.message.speaker;
  if (speaker && speaker.actor) {
    const actor = game.actors.get(speaker.actor);
    info.portrait = actor && actor.img;
    info.name = (actor && actor.name) || (speakerInfo.author && speakerInfo.author.name) || '';
  } else {
    const author = speakerInfo.author;
    info.portrait = author && author.avatar;
    info.name = author && author.name;
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
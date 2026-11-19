/* Wallpaper: validate, downscale, store in IndexedDB, apply. Nothing leaves the device. */
const Wall=(()=>{
  const bg=document.getElementById('bg'),DEF='assets/image.png';let blobUrl=null;
  const setBg=src=>{bg.style.backgroundImage=`url("${src}")`};
  async function init(){
    const blob=await Store.idbGet('wallpaper');
    if(blob instanceof Blob){blobUrl=URL.createObjectURL(blob);setBg(blobUrl)}else setBg(DEF);
  }
  async function prepare(file){
    if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('Please choose a JPG, PNG or WebP image.');
    if(file.size>20e6)throw Error('That image is larger than 20 MB.');
    let bmp;try{bmp=await createImageBitmap(file)}catch{throw Error('This image could not be read.')}
    const k=Math.min(1,1920/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');
    c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
    return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(Error('Could not process the image.')),'image/jpeg',.88));
  }
  async function apply(blob){
    await Store.idbPut('wallpaper',blob);
    if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(blob);setBg(blobUrl);await Theme.fromImage(blobUrl);
  }
  async function remove(){await Store.idbDel('wallpaper');if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=null;setBg(DEF);Theme.useDefault()}
  function openDialog(){
    const d=document.getElementById('dlg');let pending=null,prevUrl=null;
    d.innerHTML=`<h2>Change Wallpaper</h2><p class="muted">JPG, PNG or WebP. Stays on this device.</p>
    <label for="wf">Choose an image</label><input type="file" id="wf" accept="image/jpeg,image/png,image/webp">
    <div id="wp"></div><div class="err" id="we"></div>
    <div class="btns"><button class="btn primary" id="wa" disabled>Apply</button><button class="btn" id="wr">Restore default</button><button class="btn" id="wc">Close</button></div>`;
    const err=m=>d.querySelector('#we').textContent=m||'';
    d.querySelector('#wf').onchange=async e=>{err();pending=null;d.querySelector('#wa').disabled=true;const f=e.target.files[0];if(!f)return;
      try{pending=await prepare(f);if(prevUrl)URL.revokeObjectURL(prevUrl);prevUrl=URL.createObjectURL(pending);
        d.querySelector('#wp').innerHTML=`<img alt="Preview" src="${prevUrl}">`;d.querySelector('#wa').disabled=false}catch(x){err(x.message)}};
    d.querySelector('#wa').onclick=async()=>{try{await apply(pending);d.close();App.toast('Wallpaper applied')}catch{err('Could not save the wallpaper (storage may be full or blocked).')}};
    d.querySelector('#wr').onclick=async()=>{await remove();d.close();App.toast('Default wallpaper restored')};
    d.querySelector('#wc').onclick=()=>d.close();
    d.onclose=()=>{if(prevUrl)URL.revokeObjectURL(prevUrl)};d.showModal();
  }
  return{init,openDialog,remove};
})();

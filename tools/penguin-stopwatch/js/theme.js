/* Wallpaper-driven palette -> CSS variables. Text stays light; the veil darkens bright wallpapers. */
const Theme=(()=>{
  const KEY='ps_theme',DEF={h:195,lum:.2,accent:null,intensity:.5};
  let t={...DEF,...Store.get(KEY,{})};
  const root=document.documentElement.style;
  const rgbHue=(r,g,b)=>{r/=255;g/=255;b/=255;const M=Math.max(r,g,b),d=M-Math.min(r,g,b);if(!d)return 0;const h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;return(h*60+360)%360};
  const hexHue=hex=>{const n=parseInt(hex.slice(1),16);return rgbHue(n>>16,(n>>8)&255,n&255)};
  function apply(){
    const h=t.accent?hexHue(t.accent):t.h,v=(k,x)=>root.setProperty(k,x);
    v('--primary',t.accent||`hsl(${h} 95% 52%)`);
    v('--secondary',`hsl(${(h+35)%360} 75% 55%)`);
    v('--accent',`hsl(${(h+180)%360} 85% 72%)`);
    v('--surface',`rgba(255,255,255,${(.05+.1*t.intensity).toFixed(2)})`);
    v('--hover',`rgba(255,255,255,${(.1+.12*t.intensity).toFixed(2)})`);
    v('--border-color',`rgba(255,255,255,${(.2+.2*t.intensity).toFixed(2)})`);
    v('--menu-bg',`hsl(${h} 30% 8% / .95)`);
    v('--overlay',`rgba(0,0,0,${Math.min(.85,.25+.35*t.intensity+.35*t.lum).toFixed(2)})`);
  }
  const save=()=>{Store.set(KEY,t);apply()};
  function fromImage(src){
    return new Promise(res=>{const img=new Image();img.onload=()=>{try{
      const c=document.createElement('canvas');c.width=c.height=40;const x=c.getContext('2d');x.drawImage(img,0,0,40,40);
      const d=x.getImageData(0,0,40,40).data;let sx=0,sy=0,w=0,L=0;
      for(let i=0;i<d.length;i+=4){const M=Math.max(d[i],d[i+1],d[i+2])/255,m=Math.min(d[i],d[i+1],d[i+2])/255;L+=(M+m)/2;
        const wt=(M-m)*M,a=rgbHue(d[i],d[i+1],d[i+2])*Math.PI/180;sx+=Math.cos(a)*wt;sy+=Math.sin(a)*wt;w+=wt}
      t.h=w>1?(Math.atan2(sy,sx)*180/Math.PI+360)%360:DEF.h;t.lum=L/(d.length/4);t.accent=null;
    }catch{t.h=DEF.h;t.lum=DEF.lum}save();res()};img.onerror=()=>{useDefault();res()};img.src=src});
  }
  const useDefault=()=>{t.h=DEF.h;t.lum=DEF.lum;t.accent=null;save()};
  return{get:()=>t,apply,fromImage,useDefault,
    setAccent(hex){t.accent=hex;save()},setIntensity(i){t.intensity=Math.min(1,Math.max(0,i));save()},
    restoreAuto(){t.accent=null;save()},reset(){t={...DEF};save()}};
})();

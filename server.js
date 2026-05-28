import { useState, useEffect } from "react";

const API = "https://backend-production-7b3d.up.railway.app";
const PAYSTACK_KEY = "pk_live_75c0a26b0b5dae75398ef98e5a89bc1723b6d1ce";

const NETWORKS = [
  { id:"mtn", name:"MTN", dot:"#f5b800", bundles:[
    {id:1,size:"1GB",  cap:1,  price:5.00,  ws:4.50,  pop:false},
    {id:2,size:"2GB",  cap:2,  price:9.50,  ws:8.60,  pop:false},
    {id:3,size:"3GB",  cap:3,  price:14.50, ws:13.20, pop:false},
    {id:4,size:"4GB",  cap:4,  price:20.00, ws:18.00, pop:false},
    {id:5,size:"5GB",  cap:5,  price:24.50, ws:22.10, pop:true },
    {id:6,size:"6GB",  cap:6,  price:29.00, ws:26.40, pop:false},
    {id:7,size:"8GB",  cap:8,  price:39.00, ws:35.50, pop:false},
    {id:8,size:"10GB", cap:10, price:47.00, ws:42.60, pop:false},
    {id:9,size:"15GB", cap:15, price:69.00, ws:63.00, pop:false},
    {id:10,size:"20GB",cap:20, price:89.00, ws:81.20, pop:false},
    {id:11,size:"25GB",cap:25, price:111.00,ws:100.78,pop:false},
    {id:12,size:"30GB",cap:30, price:136.00,ws:124.00,pop:false},
    {id:13,size:"40GB",cap:40, price:175.00,ws:159.00,pop:false},
    {id:14,size:"100GB",cap:100,price:415.00,ws:377.30,pop:false},
  ]},
  { id:"telecel", name:"Telecel", dot:"#ff1a27", bundles:[
    {id:1,size:"5GB", cap:5,  price:25.00, ws:23.00,  pop:false},
    {id:2,size:"10GB",cap:10, price:46.00, ws:42.00,  pop:true },
    {id:3,size:"15GB",cap:15, price:64.00, ws:58.50,  pop:false},
    {id:4,size:"20GB",cap:20, price:85.00, ws:76.93,  pop:false},
    {id:5,size:"25GB",cap:25, price:105.00,ws:95.00,  pop:false},
    {id:6,size:"30GB",cap:30, price:123.00,ws:112.00, pop:false},
    {id:7,size:"40GB",cap:40, price:163.00,ws:147.98, pop:false},
    {id:8,size:"50GB",cap:50, price:197.00,ws:179.00, pop:false},
  ]},
  { id:"airteltigo", name:"AirtelTigo", dot:"#ff4d38", bundles:[
    {id:1,size:"1GB", cap:1,  price:4.90,  ws:4.40,  pop:false},
    {id:2,size:"2GB", cap:2,  price:9.40,  ws:8.56,  pop:false},
    {id:3,size:"3GB", cap:3,  price:13.20, ws:12.00, pop:false},
    {id:4,size:"4GB", cap:4,  price:18.00, ws:16.50, pop:false},
    {id:5,size:"5GB", cap:5,  price:22.50, ws:20.50, pop:true },
    {id:6,size:"6GB", cap:6,  price:28.50, ws:25.87, pop:false},
    {id:7,size:"8GB", cap:8,  price:37.00, ws:33.59, pop:false},
    {id:8,size:"10GB",cap:10, price:47.00, ws:42.56, pop:false},
    {id:9,size:"15GB",cap:15, price:74.00, ws:67.20, pop:false},
  ]},
];

const STEPS=[
  {icon:"📡",step:"01",title:"Pick Network",  desc:"Choose MTN, Telecel, or AirtelTigo."},
  {icon:"📦",step:"02",title:"Select Bundle", desc:"Pick your data size — all bundles are non-expiry."},
  {icon:"💳",step:"03",title:"Pay with MoMo", desc:"Mobile Money via Paystack — fast and secure."},
  {icon:"⚡",step:"04",title:"Get Bundle",    desc:"Delivered to recipient number automatically."},
];

const FAQS=[
  {q:"How fast do I receive my bundle?",         a:"Delivery is automatic — usually within 30 seconds of payment confirmation."},
  {q:"What does Non-Expiry mean?",               a:"Non-expiry bundles never expire. They stay on your account until used."},
  {q:"What payment methods are accepted?",       a:"Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo Money) via Paystack."},
  {q:"Can recipient and payment number differ?", a:"Yes! Enter the number receiving the bundle and a separate MoMo number to pay."},
  {q:"How does the wholesale program work?",     a:"Pay a one-time GH₵50 fee to become a verified reseller with discounted prices."},
  {q:"What if my bundle does not arrive?",       a:"Contact us on WhatsApp immediately. We resolve all issues within 15 minutes."},
];

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--blue:#1A2FBF;--blue-d:#0B1664;--orange:#FF6B1A;--orange-l:#ff8a45;--gray:#F3F5FF;--muted:#8892c4}
html{scroll-behavior:smooth}
.nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 5%;transition:all .3s}
.nav.solid{background:rgba(11,22,100,.97);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.07)}
.nav-inner{height:68px;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:10px;cursor:pointer}
.logo-box{width:38px;height:38px;background:var(--orange);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;color:#fff}
.logo-txt{font-size:22px;font-weight:900}.logo-txt b{color:#fff}.logo-txt span{color:var(--orange)}
.nav-links{display:flex;align-items:center;gap:28px}
.nav-links a{color:rgba(255,255,255,.72);font-size:14px;font-weight:700;text-decoration:none;cursor:pointer;letter-spacing:.6px;transition:color .2s;text-transform:uppercase}
.nav-links a:hover{color:var(--orange)}
.nav-btn{background:var(--orange);color:#fff;border:none;padding:10px 22px;border-radius:9px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;text-transform:uppercase;transition:all .2s}
.nav-btn:hover{background:var(--orange-l)}
.hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px}
.hamburger span{display:block;width:24px;height:2px;background:#fff;border-radius:2px}
.mob-menu{position:fixed;top:68px;left:0;right:0;background:var(--blue-d);z-index:999;padding:8px 5% 20px;border-bottom:1px solid rgba(255,255,255,.06)}
.mob-menu a{display:block;color:rgba(255,255,255,.8);font-size:18px;font-weight:700;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;text-transform:uppercase}
.mob-btn{width:100%;margin-top:16px;padding:14px;background:var(--orange);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;text-transform:uppercase}
.hero{min-height:100vh;background:linear-gradient(140deg,#060f4a 0%,#1A2FBF 55%,#0a1260 100%);display:flex;flex-direction:column;justify-content:center;padding:130px 5% 90px;position:relative;overflow:hidden}
.orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none}
.badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.9);padding:7px 16px;border-radius:50px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:28px;width:fit-content}
.bdot{width:7px;height:7px;border-radius:50%;background:var(--orange);animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
.h1{font-size:clamp(56px,12vw,104px);font-weight:900;line-height:.88;letter-spacing:-1px;text-transform:uppercase;margin-bottom:26px}
.h1 .w1{color:#fff;display:block}.h1 .w2{color:var(--orange);display:block}
.h1 .w3{color:rgba(255,255,255,.18);display:block;-webkit-text-stroke:2px rgba(255,255,255,.25)}
.h1 .w4{color:#fff;display:block}
.hsub{color:rgba(255,255,255,.6);font-size:17px;font-weight:500;max-width:420px;line-height:1.65;margin-bottom:38px;font-family:'Barlow',sans-serif}
.hbtns{display:flex;gap:14px;flex-wrap:wrap}
.btn-s{background:var(--orange);color:#fff;border:none;padding:16px 32px;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;letter-spacing:.5px;transition:all .25s;font-family:inherit;text-transform:uppercase}
.btn-s:hover{background:var(--orange-l);transform:translateY(-3px);box-shadow:0 10px 28px rgba(255,107,26,.45)}
.btn-g{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.28);padding:16px 32px;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;transition:all .25s;font-family:inherit;text-transform:uppercase}
.btn-g:hover{border-color:#fff;background:rgba(255,255,255,.08)}
.hstats{display:flex;gap:36px;margin-top:56px;padding-top:36px;border-top:1px solid rgba(255,255,255,.1);flex-wrap:wrap}
.snum{font-size:28px;font-weight:900;color:var(--orange);line-height:1}
.slbl{font-size:12px;color:rgba(255,255,255,.5);font-weight:700;letter-spacing:.5px;margin-top:4px;font-family:'Barlow',sans-serif;text-transform:uppercase}
.sec{padding:80px 5%}.sec-dark{background:var(--blue-d)}.sec-gray{background:var(--gray)}
.shd{font-size:clamp(30px,6vw,52px);font-weight:900;text-transform:uppercase;letter-spacing:-.5px;line-height:1}
.shd.light{color:#fff}.shd.dark{color:var(--blue-d)}
.ssub{font-size:16px;margin-top:10px;font-family:'Barlow',sans-serif;font-weight:500}
.ssub.light{color:rgba(255,255,255,.5)}.ssub.dark{color:var(--muted)}
.orange{color:var(--orange)}
.net-tabs{display:flex;gap:10px;margin:32px 0 28px;flex-wrap:wrap}
.ntab{display:flex;align-items:center;gap:8px;padding:11px 22px;border-radius:12px;border:2px solid rgba(255,255,255,.14);color:rgba(255,255,255,.55);font-size:14px;font-weight:800;cursor:pointer;transition:all .2s;background:transparent;font-family:inherit;letter-spacing:.5px;text-transform:uppercase}
.ntab.on{border-color:var(--orange);color:#fff;background:rgba(255,107,26,.14)}
.ntab:hover:not(.on){border-color:rgba(255,255,255,.3);color:rgba(255,255,255,.85)}
.ndot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.tier-wrap{display:inline-flex;background:rgba(255,255,255,.07);border-radius:12px;padding:4px;margin-bottom:32px;border:1px solid rgba(255,255,255,.08)}
.tbtn{padding:10px 24px;border-radius:9px;border:none;font-size:13px;font-weight:800;cursor:pointer;letter-spacing:.5px;transition:all .22s;font-family:inherit;text-transform:uppercase;background:transparent;color:rgba(255,255,255,.5)}
.tbtn.on{background:var(--orange);color:#fff;box-shadow:0 4px 14px rgba(255,107,26,.4)}
.bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:12px}
.bcard{background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.09);border-radius:16px;padding:20px 18px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden}
.bcard:hover{transform:translateY(-4px);background:rgba(255,255,255,.08);border-color:var(--orange);box-shadow:0 14px 36px rgba(0,0,0,.35)}
.bcard-pop::after{content:'POPULAR';position:absolute;top:12px;right:-2px;background:var(--orange);color:#fff;font-size:9px;font-weight:900;padding:3px 10px 3px 8px;letter-spacing:1.5px;border-radius:4px 0 0 4px}
.bsize{font-size:36px;font-weight:900;color:#fff;line-height:1;letter-spacing:-1px}
.bvalid{font-size:11px;color:var(--muted);font-weight:600;margin:4px 0 14px;font-family:'Barlow',sans-serif;letter-spacing:.5px;text-transform:uppercase}
.bprice{font-size:26px;font-weight:900;color:var(--orange);line-height:1}
.bsave{display:inline-flex;align-items:center;background:rgba(255,107,26,.18);color:var(--orange);font-size:10px;font-weight:800;padding:3px 9px;border-radius:6px;margin-top:6px;letter-spacing:.5px}
.bbtn{width:100%;margin-top:16px;padding:11px;background:var(--orange);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;text-transform:uppercase;letter-spacing:.5px;transition:all .2s}
.bbtn:hover{background:var(--orange-l)}
.walert{background:rgba(255,107,26,.1);border:1px solid rgba(255,107,26,.28);border-radius:13px;padding:14px 18px;margin-bottom:26px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.walert-txt{color:rgba(255,255,255,.8);font-size:14px;font-family:'Barlow',sans-serif;flex:1;line-height:1.5}
.walert-btn{background:var(--orange);color:#fff;border:none;padding:9px 18px;border-radius:8px;font-weight:800;cursor:pointer;font-size:13px;font-family:inherit;white-space:nowrap;text-transform:uppercase}
.sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px;margin-top:44px}
.scard{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:28px;transition:all .2s}
.scard:hover{background:rgba(255,255,255,.07);transform:translateY(-3px)}
.siw{width:52px;height:52px;background:rgba(255,107,26,.15);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:18px}
.snum2{font-size:11px;font-weight:800;color:var(--orange);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
.stit{font-size:22px;font-weight:800;color:#fff;margin-bottom:8px}
.sdesc{font-size:14px;color:rgba(255,255,255,.5);line-height:1.65;font-family:'Barlow',sans-serif}
.afa-wrap{padding:0 5% 80px}
.afa-box{background:linear-gradient(135deg,#0B1664 0%,#1A2FBF 100%);border-radius:24px;padding:56px 5%;position:relative;overflow:hidden}
.afa-box::before{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:rgba(255,107,26,.1)}
.afa-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,107,26,.2);border:1px solid rgba(255,107,26,.35);color:var(--orange);padding:6px 14px;border-radius:50px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px}
.afa-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;position:relative;z-index:1}
.afa-perks{display:flex;flex-direction:column;gap:14px;margin-top:24px}
.afa-perk{display:flex;align-items:center;gap:12px;color:rgba(255,255,255,.85);font-size:15px;font-weight:700}
.afa-perk-icon{width:32px;height:32px;background:rgba(255,107,26,.2);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.afa-price-box{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:36px;text-align:center}
.afa-price-lbl{font-size:11px;color:var(--orange);font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px}
.afa-price{font-size:58px;font-weight:900;color:#fff;line-height:1;margin-bottom:6px}
.afa-price-sub{font-size:14px;color:rgba(255,255,255,.5);font-family:'Barlow',sans-serif;margin-bottom:28px;line-height:1.6}
.afa-btn{width:100%;padding:16px;background:var(--orange);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;text-transform:uppercase;transition:all .2s}
.afa-btn:hover{background:var(--orange-l)}
.afa-note{margin-top:14px;font-size:12px;color:rgba(255,255,255,.35);font-family:'Barlow',sans-serif}
.wbanner{background:linear-gradient(135deg,#FF6B1A 0%,#d94f00 100%);border-radius:24px;padding:56px 5%;margin:0 5% 80px;display:flex;align-items:center;justify-content:space-between;gap:40px;flex-wrap:wrap;position:relative;overflow:hidden}
.wbanner::before{content:'';position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.08)}
.wleft h2{font-size:clamp(26px,5vw,46px);font-weight:900;color:#fff;text-transform:uppercase;line-height:.95}
.wleft p{font-size:16px;color:rgba(255,255,255,.82);margin-top:14px;font-family:'Barlow',sans-serif;max-width:420px;line-height:1.6}
.wperks{display:flex;gap:16px;margin-top:24px;flex-wrap:wrap}
.perk{display:flex;align-items:center;gap:8px;color:#fff;font-size:14px;font-weight:700}
.pbox{width:28px;height:28px;background:rgba(255,255,255,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px}
.wreg-btn{background:#fff;color:var(--orange);border:none;padding:18px 36px;border-radius:14px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;text-transform:uppercase;transition:all .22s;flex-shrink:0;position:relative;z-index:1}
.wreg-btn:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.2)}
.flist{margin-top:40px;display:flex;flex-direction:column;gap:12px;max-width:760px;margin-left:auto;margin-right:auto}
.fitem{border:1.5px solid #dde3ff;border-radius:14px;overflow:hidden;transition:all .2s}
.fitem.open{border-color:var(--blue);box-shadow:0 4px 20px rgba(26,47,191,.1)}
.fq{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;cursor:pointer;gap:16px}
.fqtxt{font-size:17px;font-weight:800;color:var(--blue-d);line-height:1.3}
.ficon{width:28px;height:28px;border-radius:8px;background:var(--gray);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;transition:all .2s;color:var(--blue)}
.fitem.open .ficon{background:var(--blue);color:#fff;transform:rotate(45deg)}
.fa-ans{padding:0 22px 18px;font-size:15px;color:#555;font-family:'Barlow',sans-serif;line-height:1.7}
.footer{background:var(--blue-d);padding:60px 5% 28px}
.fgrid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:40px;padding-bottom:44px;border-bottom:1px solid rgba(255,255,255,.07)}
.flogo{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.flogo-box{width:38px;height:38px;background:var(--orange);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;color:#fff}
.flogo-txt{font-size:22px;font-weight:900}.flogo-txt b{color:#fff}.flogo-txt span{color:var(--orange)}
.ftagline{font-size:12px;color:rgba(255,255,255,.38);font-weight:700;letter-spacing:1.5px;text-transform:uppercase;font-family:'Barlow',sans-serif;margin-bottom:22px}
.fwa{display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:11px 18px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none}
.fctit{font-size:11px;font-weight:800;color:var(--orange);letter-spacing:2px;text-transform:uppercase;margin-bottom:18px}
.flinks{list-style:none;display:flex;flex-direction:column;gap:11px}
.flinks li{color:rgba(255,255,255,.55);font-size:15px;font-weight:500;cursor:pointer;transition:color .2s;font-family:'Barlow',sans-serif}
.flinks li:hover{color:#fff}
.fbot{display:flex;align-items:center;justify-content:space-between;padding-top:22px;flex-wrap:wrap;gap:12px}
.fcopy{font-size:13px;color:rgba(255,255,255,.35);font-family:'Barlow',sans-serif}
.fcopy span{color:var(--orange)}
.wafab{position:fixed;bottom:24px;right:24px;z-index:9999;background:#25D366;color:#fff;width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;text-decoration:none;box-shadow:0 6px 24px rgba(37,211,102,.5);transition:all .2s}
.wafab:hover{transform:scale(1.12)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:5000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(5px)}
.modal{background:#fff;border-radius:22px;padding:36px;width:100%;max-width:460px;max-height:92vh;overflow-y:auto;position:relative}
.modal-x{position:absolute;top:16px;right:16px;background:#f0f2ff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;color:#555}
.mtit{font-size:26px;font-weight:900;color:var(--blue-d);margin-bottom:4px}
.msub{font-size:14px;color:#888;margin-bottom:26px;font-family:'Barlow',sans-serif;line-height:1.5}
.obox{background:var(--gray);border-radius:14px;padding:20px;margin-bottom:24px}
.orow{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.orow:last-child{margin:0;border-top:1px solid #dde3ff;padding-top:12px;margin-top:6px}
.olbl{font-size:13px;color:#999;font-family:'Barlow',sans-serif;font-weight:500}
.oval{font-size:15px;font-weight:800;color:var(--blue-d)}
.ototl{font-size:24px;font-weight:900;color:var(--orange)}
.tip-box{background:#f0f4ff;border:1px solid #dde3ff;border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#555;font-family:'Barlow',sans-serif;line-height:1.6}
.igrp{margin-bottom:16px}
.ilbl{font-size:12px;font-weight:800;color:var(--blue-d);margin-bottom:7px;display:block;letter-spacing:.3px;text-transform:uppercase}
.ifield{width:100%;padding:13px 16px;border:2px solid #dde3ff;border-radius:11px;font-size:15px;font-family:'Barlow',sans-serif;outline:none;transition:border-color .2s;background:#fafbff;color:#0d1340}
.ifield:focus{border-color:var(--blue)}
select.ifield{appearance:none;cursor:pointer}
.btnpay{width:100%;padding:16px;background:var(--blue);color:#fff;border:none;border-radius:13px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;text-transform:uppercase;letter-spacing:.5px;transition:all .2s;margin-top:8px}
.btnpay:hover{background:#1535d4}
.btnpay:disabled{opacity:.5;cursor:not-allowed}
.err-box{background:#fff0f0;border:1px solid #ffcccc;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:14px;color:#cc0000;font-family:'Barlow',sans-serif}
.success-wrap{text-align:center;padding:20px 0}
.sico{font-size:68px;margin-bottom:16px}
.stit2{font-size:28px;font-weight:900;color:var(--blue-d);margin-bottom:8px}
.sdesc2{font-size:15px;color:#777;font-family:'Barlow',sans-serif;line-height:1.65;margin-bottom:26px}
@media(max-width:900px){.fgrid{grid-template-columns:1fr 1fr}.wbanner{text-align:center}.wperks{justify-content:center}.wreg-btn{width:100%}.afa-grid{grid-template-columns:1fr}}
@media(max-width:640px){.nav-links,.nav-btn{display:none}.hamburger{display:flex}.fgrid{grid-template-columns:1fr}.bgrid{grid-template-columns:1fr 1fr}.hstats{gap:22px}}
@media(max-width:400px){.bgrid{grid-template-columns:1fr}}
`;

type B = {id:number;size:string;cap:number;price:number;ws:number;pop:boolean};
type N = {id:string;name:string;dot:string;bundles:B[]};
type Cart = B & {networkName:string};

declare global { interface Window { PaystackPop: any; } }

export default function App() {
  const [activeNet,      setActiveNet]      = useState<string>("mtn");
  const [isWholesale,    setIsWholesale]    = useState<boolean>(false);
  const [modal,          setModal]          = useState<string|null>(null);
  const [cart,           setCart]           = useState<Cart|null>(null);
  const [menuOpen,       setMenuOpen]       = useState<boolean>(false);
  const [openFaq,        setOpenFaq]        = useState<number|null>(null);
  const [scrolled,       setScrolled]       = useState<boolean>(false);
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [paymentPhone,   setPaymentPhone]   = useState<string>("");
  const [payError,       setPayError]       = useState<string>("");
  const [paying,         setPaying]         = useState<boolean>(false);
  const [orderSuccess,   setOrderSuccess]   = useState<boolean>(false);
  const [orderRef,       setOrderRef]       = useState<string>("");
  const [wForm,          setWForm]          = useState({name:"",phone:"",email:"",network:"mtn"});
  const [wSuccess,       setWSuccess]       = useState<boolean>(false);
  const [afaForm,        setAfaForm]        = useState({name:"",ghCard:"",occupation:"",email:"",residence:"",dob:"",phone:""});
  const [afaSuccess,     setAfaSuccess]     = useState<boolean>(false);

  const network = NETWORKS.find(n=>n.id===activeNet) as N;
  const price   = (b:B) => isWholesale ? b.ws : b.price;

  // Load Paystack script
  useEffect(()=>{
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.async = true;
    document.head.appendChild(s);
    const fn = ()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",fn);
    return ()=>{ window.removeEventListener("scroll",fn); };
  },[]);

  const go = (id:string)=>{ document.getElementById(id)?.scrollIntoView({behavior:"smooth"}); setMenuOpen(false); };

  const openBuy = (b:B)=>{
    setCart({...b,networkName:network.name});
    setRecipientPhone(""); setPaymentPhone("");
    setPayError(""); setPaying(false); setOrderSuccess(false);
    setModal("buy");
  };

  const handlePay = ()=>{
    setPayError("");
    const r = recipientPhone.replace(/[\s\-]/g,"");
    const p = paymentPhone.replace(/[\s\-]/g,"");
    if(r.length < 9){ setPayError("Please enter a valid recipient number."); return; }
    if(p.length < 9){ setPayError("Please enter a valid MoMo payment number."); return; }
    if(!cart){ return; }

    if(!window.PaystackPop){
      setPayError("Payment system not ready. Please refresh and try again.");
      return;
    }

    setPaying(true);
    const ref = `UNI-${Date.now()}`;
    const email = `${p}@unimarket.auto`;

    const handler = window.PaystackPop.setup({
      key:      PAYSTACK_KEY,
      email,
      amount:   Math.round(price(cart) * 100),
      currency: "GHS",
      ref,
      channels: ["mobile_money"],
      metadata: {
        recipient_phone: recipientPhone,
        payment_phone:   paymentPhone,
        bundle_size:     cart.size,
        network:         cart.networkName,
        capacity:        cart.cap,
        is_wholesale:    isWholesale,
      },
      callback: (response:{reference:string})=>{
        // Payment done — tell backend to verify & deliver
        fetch(`${API}/api/payments/verify/${response.reference}`)
          .then(r=>r.json())
          .then(data=>{
            setOrderRef(response.reference);
            setOrderSuccess(true);
            setPaying(false);
          })
          .catch(()=>{
            setOrderRef(response.reference);
            setOrderSuccess(true);
            setPaying(false);
          });
      },
      onClose: ()=>{
        setPaying(false);
      },
    });
    handler.openIframe();
  };

  const handleWholesale = ()=>{
    if(!wForm.name||wForm.phone.replace(/\s/g,"").length<9) return;
    fetch(`${API}/api/wholesale/register`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name:wForm.name,phone:wForm.phone,email:wForm.email,primary_network:wForm.network}),
    })
    .then(r=>r.json())
    .then(d=>{ if(d.authorization_url) window.location.href=d.authorization_url; else setWSuccess(true); })
    .catch(()=>setWSuccess(true));
  };

  const handleAFA = ()=>{
    if(!afaForm.name||!afaForm.ghCard||afaForm.phone.replace(/\s/g,"").length<9) return;
    fetch(`${API}/api/afa/register`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name:afaForm.name,phone:afaForm.phone,gh_card:afaForm.ghCard,occupation:afaForm.occupation,email:afaForm.email,residence:afaForm.residence,dob:afaForm.dob}),
    })
    .then(r=>r.json())
    .then(d=>{ if(d.authorization_url) window.location.href=d.authorization_url; else setAfaSuccess(true); })
    .catch(()=>setAfaSuccess(true));
  };

  const closeModal = ()=>{ setModal(null); setCart(null); setWSuccess(false); setAfaSuccess(false); setPaying(false); setPayError(""); setOrderSuccess(false); };

  return (
    <div style={{fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",background:"#fff",overflowX:"hidden"}}>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled?"solid":""}`}>
        <div className="nav-inner">
          <div className="logo" onClick={()=>go("hero")}>
            <div className="logo-box">U</div>
            <div className="logo-txt"><b>UNI</b><span>MARKET</span></div>
          </div>
          <div className="nav-links">
            <a onClick={()=>go("bundles")}>Bundles</a>
            <a onClick={()=>go("how")}>How It Works</a>
            <a onClick={()=>go("afa")}>AFA Bundle</a>
            <a onClick={()=>go("wholesale")}>Resellers</a>
            <a onClick={()=>go("faq")}>FAQ</a>
          </div>
          <button className="nav-btn" onClick={()=>go("bundles")}>Buy Data →</button>
          <button className="hamburger" onClick={()=>setMenuOpen(!menuOpen)}><span/><span/><span/></button>
        </div>
      </nav>

      {menuOpen&&(
        <div className="mob-menu">
          <a onClick={()=>go("bundles")}>Bundles</a>
          <a onClick={()=>go("how")}>How It Works</a>
          <a onClick={()=>go("afa")}>AFA Bundle</a>
          <a onClick={()=>go("wholesale")}>Resellers</a>
          <a onClick={()=>go("faq")}>FAQ</a>
          <button className="mob-btn" onClick={()=>go("bundles")}>Buy Bundle →</button>
        </div>
      )}

      {/* HERO */}
      <section id="hero" className="hero">
        <div className="orb" style={{width:600,height:600,background:"#FF6B1A",opacity:.18,top:-150,right:-120}}/>
        <div className="orb" style={{width:400,height:400,background:"#1A2FBF",opacity:.3,bottom:-80,left:"35%"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div className="badge"><span className="bdot"/>NOW OPEN — NON-EXPIRY BUNDLES</div>
          <h1 className="h1">
            <span className="w1">ONE</span><span className="w2">MARKET.</span>
            <span className="w3">EVERYTHING</span><span className="w4">YOU NEED.</span>
          </h1>
          <p className="hsub">Non-expiry data bundles for MTN, Telecel and AirtelTigo. Pay with MoMo. Delivered instantly.</p>
          <div className="hbtns">
            <button className="btn-s" onClick={()=>go("bundles")}>Start Shopping →</button>
            <button className="btn-g" onClick={()=>go("wholesale")}>Become a Reseller</button>
          </div>
          <div className="hstats">
            <div><div className="snum">3</div><div className="slbl">Networks</div></div>
            <div><div className="snum">♾️</div><div className="slbl">Non-Expiry</div></div>
            <div><div className="snum">24/7</div><div className="slbl">Support</div></div>
            <div><div className="snum">🔒</div><div className="slbl">Paystack Secured</div></div>
          </div>
        </div>
      </section>

      {/* BUNDLES */}
      <section id="bundles" className="sec sec-dark">
        <div className="shd light">DATA <span className="orange">BUNDLES</span></div>
        <div className="ssub light">All bundles are Non-Expiry — they never expire!</div>
        <div className="net-tabs">
          {NETWORKS.map(n=>(
            <button key={n.id} className={`ntab ${activeNet===n.id?"on":""}`} onClick={()=>setActiveNet(n.id)}>
              <span className="ndot" style={{background:n.dot}}/>{n.name}
            </button>
          ))}
        </div>
        <div className="tier-wrap">
          <button className={`tbtn ${!isWholesale?"on":""}`} onClick={()=>setIsWholesale(false)}>Retail</button>
          <button className={`tbtn ${isWholesale?"on":""}`} onClick={()=>setIsWholesale(true)}>Wholesale 💼</button>
        </div>
        {isWholesale&&(
          <div className="walert">
            <span style={{fontSize:20}}>💼</span>
            <div className="walert-txt">Wholesale prices shown. <strong style={{color:"#fff"}}>Register as a reseller (GH₵50 one-time)</strong> to access these rates.</div>
            <button className="walert-btn" onClick={()=>setModal("wholesale")}>Register Now →</button>
          </div>
        )}
        <div className="bgrid">
          {network.bundles.map((b:B)=>(
            <div key={b.id} className={`bcard ${b.pop?"bcard-pop":""}`}>
              <div className="bsize">{b.size}</div>
              <div className="bvalid">♾️ Non-Expiry</div>
              <div className="bprice">GH₵{price(b)}</div>
              {isWholesale&&<div className="bsave">💰 Save GH₵{(b.price-b.ws).toFixed(2)}</div>}
              <button className="bbtn" onClick={()=>openBuy(b)}>Buy Now →</button>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="sec sec-dark" style={{paddingTop:0}}>
        <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:72}}>
          <div className="shd light">HOW IT <span className="orange">WORKS</span></div>
          <div className="ssub light">Four simple steps — buy your bundle in under a minute</div>
          <div className="sgrid">
            {STEPS.map((s,i)=>(
              <div key={i} className="scard">
                <div className="siw">{s.icon}</div>
                <div className="snum2">Step {s.step}</div>
                <div className="stit">{s.title}</div>
                <div className="sdesc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AFA BUNDLE */}
      <div id="afa" className="afa-wrap">
        <div className="afa-box">
          <div className="afa-badge">⭐ AFA Bundle</div>
          <div className="afa-grid">
            <div>
              <div className="shd light">AGENT FOR <span className="orange">AGENTS</span></div>
              <p style={{color:"rgba(255,255,255,.7)",fontSize:16,fontFamily:"'Barlow',sans-serif",marginTop:14,lineHeight:1.6,maxWidth:400}}>
                Register as an AFA Agent and unlock exclusive benefits. One-time registration for better rates.
              </p>
              <div className="afa-perks">
                {[["🎯","Agent-level access"],["💰","Exclusive AFA pricing"],["📲","Priority SMS support"],["🏆","Verified agent status"]].map(([ic,lbl])=>(
                  <div key={lbl} className="afa-perk"><div className="afa-perk-icon">{ic}</div>{lbl}</div>
                ))}
              </div>
            </div>
            <div className="afa-price-box">
              <div className="afa-price-lbl">ONE-TIME REGISTRATION</div>
              <div className="afa-price">GH₵18.50</div>
              <div className="afa-price-sub">Processing: GH₵0.36<br/><strong style={{color:"#fff"}}>Total: GH₵18.86</strong></div>
              <button className="afa-btn" onClick={()=>setModal("afa")}>Register as AFA Agent →</button>
              <div className="afa-note">Requires Ghana Card • One-time only</div>
            </div>
          </div>
        </div>
      </div>

      {/* WHOLESALE */}
      <div id="wholesale">
        <div className="wbanner">
          <div className="wleft" style={{position:"relative",zIndex:1}}>
            <h2>BECOME A<br/>RESELLER TODAY</h2>
            <p>Pay once, earn forever. Get discounted bundle prices and build your own data business.</p>
            <div className="wperks">
              {[["✅","Cheaper Prices"],["📲","SMS Alerts"],["🤝","Support"],["💰","High Margins"]].map(([ic,lbl])=>(
                <div key={lbl} className="perk"><div className="pbox">{ic}</div>{lbl}</div>
              ))}
            </div>
          </div>
          <button className="wreg-btn" onClick={()=>setModal("wholesale")}>Register — GH₵50 →</button>
        </div>
      </div>

      {/* FAQ */}
      <section id="faq" className="sec sec-gray">
        <div style={{textAlign:"center"}}>
          <div className="shd dark">FREQUENTLY ASKED <span className="orange">QUESTIONS</span></div>
        </div>
        <div className="flist">
          {FAQS.map((f,i)=>(
            <div key={i} className={`fitem ${openFaq===i?"open":""}`}>
              <div className="fq" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                <span className="fqtxt">{f.q}</span><span className="ficon">+</span>
              </div>
              {openFaq===i&&<div className="fa-ans">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="fgrid">
          <div>
            <div className="flogo"><div className="flogo-box">U</div><div className="flogo-txt"><b>UNI</b><span>MARKET</span></div></div>
            <div className="ftagline">One Market. Everything You Need.</div>
            <a className="fwa" href="https://chat.whatsapp.com/Ih8ivypyeZ2FZa8hGjWAJs" target="_blank" rel="noreferrer">💬 Join WhatsApp Group</a>
            <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
              <a href="tel:+233594520170" style={{color:"rgba(255,255,255,.6)",fontSize:14,fontFamily:"'Barlow',sans-serif",textDecoration:"none"}}>📞 +233 59 452 0170</a>
              <a href="tel:+233554874227" style={{color:"rgba(255,255,255,.6)",fontSize:14,fontFamily:"'Barlow',sans-serif",textDecoration:"none"}}>📞 +233 55 487 4227</a>
              <a href="mailto:unimarketelga@gmail.com" style={{color:"rgba(255,255,255,.6)",fontSize:14,fontFamily:"'Barlow',sans-serif",textDecoration:"none"}}>✉️ unimarketelga@gmail.com</a>
            </div>
          </div>
          <div>
            <div className="fctit">Shop</div>
            <ul className="flinks">
              {["MTN Bundles","Telecel Bundles","AirtelTigo Bundles","Wholesale"].map(l=><li key={l} onClick={()=>go("bundles")}>{l}</li>)}
            </ul>
          </div>
          <div>
            <div className="fctit">Programs</div>
            <ul className="flinks">
              <li onClick={()=>go("afa")}>AFA Bundle</li>
              <li onClick={()=>setModal("wholesale")}>Become a Reseller</li>
              <li onClick={()=>go("how")}>How It Works</li>
            </ul>
          </div>
          <div>
            <div className="fctit">Support</div>
            <ul className="flinks">
              <li><a href="https://chat.whatsapp.com/Ih8ivypyeZ2FZa8hGjWAJs" target="_blank" rel="noreferrer" style={{color:"inherit",textDecoration:"none"}}>WhatsApp Group</a></li>
              <li><a href="tel:+233594520170" style={{color:"inherit",textDecoration:"none"}}>+233 59 452 0170</a></li>
              <li><a href="mailto:unimarketelga@gmail.com" style={{color:"inherit",textDecoration:"none"}}>Send Email</a></li>
            </ul>
          </div>
        </div>
        <div className="fbot">
          <div className="fcopy">© 2026 <span>UniMarket</span>. All rights reserved.</div>
          <div className="fcopy">One Market. Everything You Need.</div>
        </div>
      </footer>

      <a href="https://chat.whatsapp.com/Ih8ivypyeZ2FZa8hGjWAJs" target="_blank" rel="noreferrer" className="wafab">💬</a>

      {/* BUY MODAL */}
      {modal==="buy"&&cart&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&!paying&&closeModal()}>
          <div className="modal">
            <button className="modal-x" onClick={closeModal} disabled={paying}>✕</button>

            {!orderSuccess ? (
              <>
                <div className="mtit">Buy Bundle</div>
                <div className="msub">{cart.size} — {cart.networkName} — Non-Expiry ♾️</div>
                <div className="obox">
                  <div className="orow"><span className="olbl">Network</span><span className="oval">{cart.networkName}</span></div>
                  <div className="orow"><span className="olbl">Bundle</span><span className="oval">{cart.size}</span></div>
                  <div className="orow"><span className="olbl">Validity</span><span className="oval">Non-Expiry ♾️</span></div>
                  <div className="orow"><span className="olbl">Amount</span><span className="ototl">GH₵{price(cart)}</span></div>
                </div>
                <div className="tip-box">
                  💡 <strong>Recipient number</strong> gets the bundle. <strong>Payment number</strong> is your MoMo. They can be different.
                </div>
                {payError&&<div className="err-box">⚠️ {payError}</div>}
                <div className="igrp">
                  <label className="ilbl">📲 Recipient Number (Gets Bundle)</label>
                  <input className="ifield" placeholder="Number receiving the bundle e.g. 0241234567" value={recipientPhone} onChange={e=>{setRecipientPhone(e.target.value);setPayError("");}} type="tel"/>
                </div>
                <div className="igrp">
                  <label className="ilbl">💳 MoMo Payment Number</label>
                  <input className="ifield" placeholder="MoMo number you are paying from e.g. 0551234567" value={paymentPhone} onChange={e=>{setPaymentPhone(e.target.value);setPayError("");}} type="tel"/>
                </div>
                <button className="btnpay" onClick={handlePay} disabled={paying}>
                  {paying ? "Processing..." : `Pay GH₵${price(cart)} with MoMo →`}
                </button>
              </>
            ) : (
              <div className="success-wrap">
                <div className="sico">🎉</div>
                <div className="stit2">Payment Successful!</div>
                <div className="sdesc2">
                  Your {cart.size} bundle is being delivered to <strong>{recipientPhone}</strong>.<br/>
                  You will receive an SMS confirmation shortly.<br/><br/>
                  <small style={{color:"#aaa"}}>Ref: {orderRef}</small>
                </div>
                <button className="btnpay" onClick={closeModal}>Done ✓</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AFA MODAL */}
      {modal==="afa"&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div className="modal">
            <button className="modal-x" onClick={closeModal}>✕</button>
            {!afaSuccess?(
              <>
                <div className="mtit">AFA Registration</div>
                <div className="msub">Agent For Agents — one-time fee of GH₵18.86.</div>
                <div className="obox">
                  <div className="orow"><span className="olbl">Package</span><span className="oval">AFA Bundle</span></div>
                  <div className="orow"><span className="olbl">Fee</span><span className="oval">GH₵18.50</span></div>
                  <div className="orow"><span className="olbl">Processing</span><span className="oval">GH₵0.36</span></div>
                  <div className="orow"><span className="olbl">Total</span><span className="ototl">GH₵18.86</span></div>
                </div>
                <div className="igrp"><label className="ilbl">Full Name</label><input className="ifield" placeholder="e.g. Kofi Mensah" value={afaForm.name} onChange={e=>setAfaForm({...afaForm,name:e.target.value})}/></div>
                <div className="igrp"><label className="ilbl">Ghana Card Number</label><input className="ifield" placeholder="GHA-XXXXXXXXX-X" value={afaForm.ghCard} onChange={e=>setAfaForm({...afaForm,ghCard:e.target.value})}/></div>
                <div className="igrp"><label className="ilbl">Phone Number</label><input className="ifield" placeholder="e.g. 024 000 0000" value={afaForm.phone} onChange={e=>setAfaForm({...afaForm,phone:e.target.value})} type="tel"/></div>
                <div className="igrp"><label className="ilbl">Occupation</label><input className="ifield" placeholder="e.g. Trader" value={afaForm.occupation} onChange={e=>setAfaForm({...afaForm,occupation:e.target.value})}/></div>
                <div className="igrp"><label className="ilbl">Email Address</label><input className="ifield" type="email" placeholder="your@email.com" value={afaForm.email} onChange={e=>setAfaForm({...afaForm,email:e.target.value})}/></div>
                <div className="igrp"><label className="ilbl">Place of Residence</label><input className="ifield" placeholder="e.g. Accra, East Legon" value={afaForm.residence} onChange={e=>setAfaForm({...afaForm,residence:e.target.value})}/></div>
                <div className="igrp"><label className="ilbl">Date of Birth</label><input className="ifield" type="date" value={afaForm.dob} onChange={e=>setAfaForm({...afaForm,dob:e.target.value})}/></div>
                <button className="btnpay" onClick={handleAFA} disabled={!afaForm.name||!afaForm.ghCard||afaForm.phone.replace(/\s/g,"").length<9}>
                  Pay GH₵18.86 & Register →
                </button>
              </>
            ):(
              <div className="success-wrap">
                <div className="sico">⭐</div>
                <div className="stit2">Registration Submitted!</div>
                <div className="sdesc2">Welcome, <strong>{afaForm.name}</strong>! AFA registration received. SMS confirmation to <strong>{afaForm.phone}</strong>.</div>
                <button className="btnpay" onClick={closeModal}>Done ✓</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WHOLESALE MODAL */}
      {modal==="wholesale"&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div className="modal">
            <button className="modal-x" onClick={closeModal}>✕</button>
            {!wSuccess?(
              <>
                <div className="mtit">Reseller Registration</div>
                <div className="msub">One-time GH₵50 fee — unlock wholesale pricing forever.</div>
                <div style={{background:"#fff8f4",border:"1px solid #ffd5be",borderRadius:12,padding:"14px 18px",marginBottom:22,display:"flex",gap:12}}>
                  <span style={{fontSize:22}}>💡</span>
                  <div style={{fontSize:13,color:"#666",fontFamily:"'Barlow',sans-serif",lineHeight:1.6}}>
                    After registration, your account will be reviewed within <strong>24 hours</strong>. SMS confirmation once verified.
                  </div>
                </div>
                <div className="igrp"><label className="ilbl">Full Name</label><input className="ifield" placeholder="Your full name" value={wForm.name} onChange={e=>setWForm({...wForm,name:e.target.value})}/></div>
                <div className="igrp"><label className="ilbl">Phone Number</label><input className="ifield" placeholder="e.g. 024 000 0000" value={wForm.phone} onChange={e=>setWForm({...wForm,phone:e.target.value})} type="tel"/></div>
                <div className="igrp"><label className="ilbl">Email (optional)</label><input className="ifield" type="email" placeholder="your@email.com" value={wForm.email} onChange={e=>setWForm({...wForm,email:e.target.value})}/></div>
                <div className="igrp">
                  <label className="ilbl">Primary Network</label>
                  <select className="ifield" value={wForm.network} onChange={e=>setWForm({...wForm,network:e.target.value})}>
                    <option value="mtn">MTN</option>
                    <option value="telecel">Telecel</option>
                    <option value="airteltigo">AirtelTigo</option>
                    <option value="all">All Networks</option>
                  </select>
                </div>
                <button className="btnpay" onClick={handleWholesale} disabled={!wForm.name||wForm.phone.replace(/\s/g,"").length<9}>
                  Pay GH₵50 & Register →
                </button>
              </>
            ):(
              <div className="success-wrap">
                <div className="sico">🙌</div>
                <div className="stit2">Application Submitted!</div>
                <div className="sdesc2">Thank you, <strong>{wForm.name}</strong>! We will approve within <strong>24 hours</strong>. SMS to <strong>{wForm.phone}</strong>.</div>
                <button className="btnpay" onClick={closeModal}>Back to UniMarket</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { getStore } from "@netlify/blobs";

const ADMIN_HASH = '7c98ffaa5719ad5f08c443a8736be7c1fcdf3d809c7e07959fba7e4cb3f6fb9b';

const DEFAULT_PRODUCTS = [
  {id:1,name:'Vază geometrică Voronoi',meta:'PLA mată albă • 18cm înălțime',price:79,stars:5,reviews:[],badge:'NOU',images:[],emoji:'🏺',bg:'bg1',cat:'Decorațiuni'},
  {id:2,name:'Dragon articulat imprimat',meta:'PLA+ multicolor • 25cm lungime',price:120,stars:5,reviews:[],badge:'TOP',images:[],emoji:'🐉',bg:'bg2',cat:'Jucării & Jocuri'},
  {id:3,name:'Organizator chei de perete',meta:'PETG negru mat • 5 cârlige',price:45,stars:4,reviews:[],badge:'',images:[],emoji:'🔑',bg:'bg3',cat:'Organizatoare'},
  {id:4,name:'Ghiveci modular suculente',meta:'PLA verde • Set 3 buc',price:65,stars:5,reviews:[],badge:'',images:[],emoji:'🌿',bg:'bg4',cat:'Decorațiuni'},
  {id:5,name:'Abajur Voronoi lampă birou',meta:'PLA translucid alb • E27',price:95,stars:5,reviews:[],badge:'PROMO',images:[],emoji:'💡',bg:'bg5',cat:'Decorațiuni'},
  {id:6,name:'Personalizat la cerere',meta:'Orice material • Orice formă',price:30,stars:5,reviews:[],badge:'',images:[],emoji:'🎯',bg:'bg6',cat:'Personalizate'},
];

export default async (req) => {
  const store = getStore({ name: "mestera-products", consistency: "strong" });

  // GET — citeste produsele
  if (req.method === 'GET') {
    let products = await store.get("products", { type: "json" });
    if (!products) {
      products = DEFAULT_PRODUCTS;
      await store.setJSON("products", products);
    }
    return Response.json(products);
  }

  // POST — salveaza (admin) sau adauga recenzie (user)
  if (req.method === 'POST') {
    const body = await req.json();

    // Salveaza produse (admin)
    if (body.action === 'save') {
      const enc = new TextEncoder();
      const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(body.adminToken));
      const hash = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2,'0')).join('');
      if (hash !== ADMIN_HASH) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      await store.setJSON("products", body.products);
      return Response.json({ ok: true });
    }

    // Adauga recenzie (orice user logat)
    if (body.action === 'review') {
      let products = await store.get("products", { type: "json" }) || DEFAULT_PRODUCTS;
      const idx = products.findIndex(p => p.id === body.productId);
      if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 });
      if (!products[idx].reviews) products[idx].reviews = [];
      products[idx].reviews.push({
        author: body.review.author,
        date: new Date().toLocaleDateString('ro-RO', {day:'numeric',month:'short',year:'numeric'}),
        stars: body.review.stars,
        text: body.review.text.slice(0, 500)
      });
      products[idx].stars = Math.round(products[idx].reviews.reduce((s,r)=>s+r.stars,0)/products[idx].reviews.length);
      await store.setJSON("products", products);
      return Response.json({ ok: true, reviews: products[idx].reviews });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config = { path: "/api/products" };

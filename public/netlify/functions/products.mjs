const JB = 'https://api.jsonbin.io/v3';

export default async (req) => {
  const KEY = Netlify.env.get('JSONBIN_KEY');

  if (!KEY) {
    return Response.json({ error: 'JSONBIN_KEY not configured' }, { status: 500 });
  }

  // GET — citeste produsele
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const binId = url.searchParams.get('bin');

    if (!binId) {
      // Creeaza bin nou cu produsele default
      const DEF = [
        {id:1,name:'Vază geometrică Voronoi',meta:'PLA mată albă • 18cm înălțime',price:79,stars:5,reviews:[],badge:'NOU',images:[],emoji:'🏺',bg:'bg1',cat:'Decorațiuni'},
        {id:2,name:'Dragon articulat imprimat',meta:'PLA+ multicolor • 25cm lungime',price:120,stars:5,reviews:[],badge:'TOP',images:[],emoji:'🐉',bg:'bg2',cat:'Jucării & Jocuri'},
        {id:3,name:'Organizator chei de perete',meta:'PETG negru mat • 5 cârlige',price:45,stars:4,reviews:[],badge:'',images:[],emoji:'🔑',bg:'bg3',cat:'Organizatoare'},
        {id:4,name:'Ghiveci modular suculente',meta:'PLA verde • Set 3 buc',price:65,stars:5,reviews:[],badge:'',images:[],emoji:'🌿',bg:'bg4',cat:'Decorațiuni'},
        {id:5,name:'Abajur Voronoi lampă birou',meta:'PLA translucid alb • E27',price:95,stars:5,reviews:[],badge:'PROMO',images:[],emoji:'💡',bg:'bg5',cat:'Decorațiuni'},
        {id:6,name:'Personalizat la cerere',meta:'Orice material • Orice formă',price:30,stars:5,reviews:[],badge:'',images:[],emoji:'🎯',bg:'bg6',cat:'Personalizate'},
      ];
      const r = await fetch(JB + '/b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': KEY, 'X-Bin-Name': 'mestera3d', 'X-Bin-Private': 'false' },
        body: JSON.stringify(DEF)
      });
      const d = await r.json();
      return Response.json({ products: DEF, binId: d.metadata.id });
    }

    // Citeste din bin existent
    const r = await fetch(JB + '/b/' + binId + '/latest', {
      headers: { 'X-Master-Key': KEY }
    });
    const d = await r.json();
    return Response.json({ products: d.record, binId });
  }

  // POST — salveaza produsele (doar admin)
  if (req.method === 'POST') {
    const body = await req.json();
    const { binId, products, adminToken } = body;

    // Verifica token admin
    const encoder = new TextEncoder();
    const data = encoder.encode(adminToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const ADMIN_HASH = '7c98ffaa5719ad5f08c443a8736be7c1fcdf3d809c7e07959fba7e4cb3f6fb9b';

    if (hash !== ADMIN_HASH) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const r = await fetch(JB + '/b/' + binId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': KEY },
      body: JSON.stringify(products)
    });

    if (r.ok) return Response.json({ ok: true });
    return Response.json({ error: 'Save failed' }, { status: 500 });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config = { path: '/api/products' };

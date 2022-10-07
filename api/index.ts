export async function handler(_req: Request) {
    const myIP = await fetch('https://icanhazip.com/').then(r => r.text())
    return new Response('Wow: ' + myIP)
}
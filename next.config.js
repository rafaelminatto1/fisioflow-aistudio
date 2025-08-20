/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Otimização de Imagens
  // Adicione aqui os domínios de onde você servirá imagens (ex: S3, Cloudinary)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },

  // Proxy reverso para a API do Flask
  // Permite que o frontend em localhost:3000 acesse a API do Flask em localhost:5001
  // sem problemas de CORS, usando o caminho /api/flask
  async rewrites() {
    return [
      {
        source: '/api/flask/:path*',
        // O destino usa o nome do serviço definido no docker-compose.yml
        destination: 'http://flask:5001/api/:path*',
      },
    ]
  },
};

module.exports = nextConfig;

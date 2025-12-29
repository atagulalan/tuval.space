export interface MasterpieceCard {
  title: string;
  pixels: string;
  contributors: string;
  url: string;
  imageUrl: string;
}

export interface StatsData {
  pixelsPlaced: {
    value: string;
    trend: string;
  };
  activeArtists: {
    value: string;
    trend: string;
  };
  totalCanvases: {
    value: string;
    trend: string;
  };
  communityMasterpieces: {
    cards: MasterpieceCard[];
  };
}

export const stats: StatsData = {
  pixelsPlaced: {
    value: '400K+',
    trend: '+12% today',
  },
  activeArtists: {
    value: '2',
    trend: '+2 new',
  },
  totalCanvases: {
    value: '11',
    trend: '+8 this week',
  },
  communityMasterpieces: {
    cards: [
      {
        title: 'Cyber City',
        pixels: '24k pixels',
        contributors: '142 contributors',
        url: '/board/cyber-city',
        imageUrl: 'https://picsum.photos/seed/cyber-city/800/450',
      },
      {
        title: 'Neon Dreams',
        pixels: '12k pixels',
        contributors: '89 contributors',
        url: '/board/neon-dreams',
        imageUrl: 'https://picsum.photos/seed/neon-dreams/800/450',
      },
      {
        title: 'Deep Space',
        pixels: '36k pixels',
        contributors: '210 contributors',
        url: '/board/deep-space',
        imageUrl: 'https://picsum.photos/seed/deep-space/800/450',
      },
    ],
  },
};


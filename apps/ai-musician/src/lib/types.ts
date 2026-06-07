export interface Persona {
  id: string;
  name: string;
  genre: string;
  worldview: string;
  signatureSound: string;
  albumConcept: string;
  coverImageUrl: string;
  createdAt: string;
}

export interface Track {
  id: string;
  personaId: string;
  title: string;
  prompt: string;
  tags: string[];
  audioUrl: string;
  coverImageUrl: string;
  createdAt: string;
}

export interface Album {
  id: string;
  personaId: string;
  title: string;
  concept: string;
  coverImageUrl: string;
  tracks: Track[];
  createdAt: string;
}

export interface Province {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
}

export interface Subdistrict {
  id: number;
  name: string;
  zipcode: string;
}

export interface Meta {
  message: string;
  code: number;
  status: string;
}

export interface Response<T> {
  meta: Meta;
  data: T[];
}

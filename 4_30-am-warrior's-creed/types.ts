
export interface TransformedBelief {
  need: string;
  text: string;
}

export enum Need {
    Certainty = 'Certainty',
    Variety = 'Variety',
    Significance = 'Significance',
    Connection = 'Connection',
    Growth = 'Growth',
    Contribution = 'Contribution'
}


import { ShotType, StoryboardShot } from './types';

export const DEFAULT_SHOTS: StoryboardShot[] = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  type: ShotType.Medium,
  descriptionEN: "",
  descriptionCN: ""
}));

export const SHOT_TYPE_LIST = Object.values(ShotType);

export const ICONS = {
  upload: <i className="fa-solid fa-cloud-arrow-up"></i>,
  camera: <i className="fa-solid fa-camera"></i>,
  magic: <i className="fa-solid fa-wand-magic-sparkles"></i>,
  copy: <i className="fa-solid fa-copy"></i>,
  trash: <i className="fa-solid fa-trash-can"></i>,
  language: <i className="fa-solid fa-language"></i>,
  spinner: <i className="fa-solid fa-circle-notch fa-spin"></i>,
  info: <i className="fa-solid fa-circle-info"></i>,
};

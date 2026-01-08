
export enum ShotType {
  Wide = "Wide Shot (全景)",
  Medium = "Medium Shot (中景)",
  CloseUp = "Close-up (特写)",
  ExtremeCloseUp = "Extreme Close-up (大特写)",
  LowAngle = "Low Angle (仰拍)",
  HighAngle = "High Angle (俯拍)",
  BirdsEye = "Bird's Eye View (鸟瞰)",
  OverTheShoulder = "Over the Shoulder (过肩)",
  Profile = "Profile Shot (侧面)",
  DutchAngle = "Dutch Angle (倾斜镜头)",
  Tracking = "Tracking Shot (追踪镜头)",
  FullShot = "Full Body Shot (全身)"
}

export interface StoryboardShot {
  id: number;
  type: ShotType;
  descriptionEN: string;
  descriptionCN: string;
}

export interface SceneAnalysis {
  descriptionEN: string;
  descriptionCN: string;
}

export interface AppState {
  images: string[]; // Base64 strings
  sceneAnalysis: SceneAnalysis | null;
  shots: StoryboardShot[];
  isAnalyzing: boolean;
  isGenerating: boolean;
  language: 'CN' | 'EN';
}

/* eslint-disable */
import { TypeStore } from "@needle-tools/engine"

// Import types
import { GalleryCharacter } from "../src/GalleryCharacter.js";
import { StandardCharacter } from "../src/StandardCharacter.js";
import { FiniteStateMachine } from "../src/framework/FiniteStateMachine.js";
import { FSMController } from "../src/framework/FiniteStateMachine.js";
import { PlayerData } from "../src/framework/PlayerData.js";
import { CommonCharacterAnimations } from "../src/modules/animations/CommonCharacterAnimations.js";
import { StateAnimation } from "../src/modules/animations/StateAnimations.js";
import { CommonCharacterAudio } from "../src/modules/audio/CommonCharacterAudio.js";
import { PlayerCamera } from "../src/modules/camera/PlayerCamera.js";
import { StandardCamera } from "../src/modules/camera/StandardCamera.js";
import { CommonAvatar } from "../src/modules/generic/CommonAvatar.js";
import { PointerVisualizer } from "../src/modules/generic/PointerVisualizer.js";
import { DesktopCharacterInput } from "../src/modules/input/DesktopCharacterInput.js";
import { Joystick } from "../src/modules/input/Joystick.js";
import { MobileCharacterInput } from "../src/modules/input/MobileCharacterInput.js";
import { PointerLock } from "../src/modules/input/PointerLock.js";
import { SimplePointerInput } from "../src/modules/input/SimplePointerInput.js";
import { CharacterPhysics } from "../src/modules/physics/CharacterPhysics.js";
import { GalleryPhysics_Scheme } from "../src/modules/physics/TeleportNavigation.js";
import { TeleportNavigation } from "../src/modules/physics/TeleportNavigation.js";

// Register types
TypeStore.add("GalleryCharacter", GalleryCharacter);
TypeStore.add("StandardCharacter", StandardCharacter);
TypeStore.add("FiniteStateMachine", FiniteStateMachine);
TypeStore.add("FSMController", FSMController);
TypeStore.add("PlayerData", PlayerData);
TypeStore.add("CommonCharacterAnimations", CommonCharacterAnimations);
TypeStore.add("StateAnimation", StateAnimation);
TypeStore.add("CommonCharacterAudio", CommonCharacterAudio);
TypeStore.add("PlayerCamera", PlayerCamera);
TypeStore.add("StandardCamera", StandardCamera);
TypeStore.add("CommonAvatar", CommonAvatar);
TypeStore.add("PointerVisualizer", PointerVisualizer);
TypeStore.add("DesktopCharacterInput", DesktopCharacterInput);
TypeStore.add("Joystick", Joystick);
TypeStore.add("MobileCharacterInput", MobileCharacterInput);
TypeStore.add("PointerLock", PointerLock);
TypeStore.add("SimplePointerInput", SimplePointerInput);
TypeStore.add("CharacterPhysics", CharacterPhysics);
TypeStore.add("GalleryPhysics_Scheme", GalleryPhysics_Scheme);
TypeStore.add("TeleportNavigation", TeleportNavigation);

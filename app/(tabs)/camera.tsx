import React from 'react'
import CameraComponent from '../components/CameraComponent';
import Toast from 'react-native-toast-message';
const camera = () => {
  return (
    <>
      <CameraComponent/>
      <Toast/>
    </>
  )
}

export default camera;

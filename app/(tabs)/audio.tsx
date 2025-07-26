import React from 'react'
import { View } from 'react-native'
import AudioComponentSecondary from '../components/AudioComponentSecondary'
import Toast from 'react-native-toast-message'

function audio(){
  return (
    <>
        <AudioComponentSecondary/>
        <Toast/>
    </>
  )
}

export default audio
import React from 'react'
import { Image } from 'react-native'
import styles from './styles';
import { ImageCardProps } from '../../interfaces/CoinInterfaces';

const ImageCard = ({ coin, network, styleCustom = {}, isCustomToken = false }: ImageCardProps) => {
  return (
    <Image
      source={
        (coin === 'ETH' && isCustomToken) ? require('../../assets/images/cards/ETH.png') :
        (coin === 'BNB' && isCustomToken) ? require('../../assets/images/cards/BNB.png') :
        (coin === 'ETH') ? require('../../assets/images/cards/ETH.png') :
        (coin === 'BNB') ? require('../../assets/images/cards/BNB.png') :
        (coin === 'BTC') ? require('../../assets/images/cards/BTC.png') :
        (coin === 'DAI') ? require('../../assets/images/cards/DAI.png') :
        (coin === 'USDT') ? require('../../assets/images/cards/USDT.png') :
        (coin === 'TUSC') ? require('../../assets/images/cards/TUSC.png') :
        (coin === 'HYDRO' && network === 'BSC') ? require('../../assets/images/cards/HYDRO.png') :
        (coin === 'HYDRO' && network !== 'BSC') ? require('../../assets/images/cards/HYDRO_ETH.png') :
        {}
      }
      style={[styles.imageCard, styleCustom]}
    />
  )
}

export default ImageCard

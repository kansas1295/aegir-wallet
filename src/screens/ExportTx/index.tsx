import React, { useContext, useState } from 'react';

import XLSX from 'xlsx';
import CryptoJS from 'crypto-js';
import RNFS from 'react-native-fs';
import Toast from 'react-native-root-toast';
import * as SecureStore from 'expo-secure-store';
import { Keyboard, PermissionsAndroid, View } from 'react-native';

import styles from './styles';
import Button from '../../components/Button';
import HeaderCustom from '../../components/Header';
import BgView from '../../components/Layouts/BgView';
import TextInputCustom from '../../components/TextInput';
import { HYDRO_ENCRYPTED_PRIVKEY } from '../../../constants';
import ViewContainer from '../../components/Layouts/ViewContainer';
import { AppStateManagerContext } from '../../context/AppStateManager';

const ExportTx = () => {
  const [ password, setPassword ] = useState('');
  const [ passwordError, setPasswordError ] = useState('');
  const { toast, web3Service, appState } = useContext(AppStateManagerContext);

  const exportDataToExcel = async () => {
    let currentToast: any = toast({
      type: 'success',
      text: 'Export started!'
    });

    const [ historyBSC, historyETH ] = await Promise.all([
      getBNBHistory(),
      getEthereumHistory()
    ])

    if(!historyETH && !historyBSC) {
      if(currentToast) Toast.hide(currentToast);
      toast({
        type: 'error',
        text: 'Could not get transaction history'
      });
      return;
    }

    const wb = XLSX.utils.book_new();
    const wsBSC = XLSX.utils.json_to_sheet(historyBSC);
    const wsETH = XLSX.utils.json_to_sheet(historyETH);

    const ColsWidth = [
      { width: 50 },
      { width: 50 },
      { width: 20 },
      { width: 20 },
      { width: 70 },
      { width: 20 },
      { width: 20 },
    ];

    wsBSC['!cols'] = ColsWidth;
    wsETH['!cols'] = ColsWidth;

    // attach sheets to spreadsheet
    XLSX.utils.book_append_sheet(wb, wsETH, 'ETH');
    XLSX.utils.book_append_sheet(wb, wsBSC, 'BSC');
    const wbout = XLSX.write(wb, {type:'binary', bookType: 'xlsx'});

    // Write generated excel to Storage
    const dt = new Date();
    let path = `${RNFS.DownloadDirectoryPath}/aegirWallet_transactions_`;
    path += `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}-`;
    path += `${dt.getHours()}-${dt.getMinutes()}-${dt.getSeconds()}.xlsx`;

    RNFS.writeFile(path, wbout, 'ascii')
    .then(() => {
      if(currentToast) Toast.hide(currentToast);

      toast({
        type: 'success',
        text: 'Export completed. You can find the exported CSV file in the download folder'
      })
    })
    .catch((e) => {
      console.log('Error RNFS.writeFile', e);
      if(currentToast) Toast.hide(currentToast);

      toast({
        type: 'error',
        text: 'Export failed!'
      })
    });
  }

  const getBNBHistory = async () => {
    try {
      const { address } = appState;
      const history = await Promise.all([
        web3Service.getBNBHistory(address),
        web3Service.getBSCTokenHistory({ token: 'HYDRO', address }),
      ]);

      return history.reduce((prev, current) => {
        return [ ...prev, ...current ];
      }, []);

    } catch(error) {
      console.log('error in ExportTx - getBNBHistory', error);
      return [];
    }
  }

  const getEthereumHistory = async () => {
    try {
      const { address } = appState;
      const history = await Promise.all([
        web3Service.getEthereumHistory({ address }),
        web3Service.getEthereumTokenHistory({ token: 'DAI', address }),
        web3Service.getEthereumTokenHistory({ token: 'USDT', address }),
        web3Service.getEthereumTokenHistory({ token: 'HYDRO', address }),
      ]);

      return history.reduce((prev, current) => {
        return [ ...prev, ...current ];
      }, []);

    } catch(error) {
      console.log('error in ExportTx - getEthereumHistory', error);
      return [];
    }
  }

  const handleClick = async () => {
    try {
      let originalPrivateKey = '';
      const encryptedPrivkey = (await SecureStore.getItemAsync(HYDRO_ENCRYPTED_PRIVKEY)) || '';

      try {
        originalPrivateKey = CryptoJS.AES.decrypt(
          encryptedPrivkey,
          password,
        ).toString(CryptoJS.enc.Utf8)
      } catch {
        // Empty
      }

      if(!originalPrivateKey) {
        setPasswordError('Password incorrect');
        return;
      }
      setPassword('');
      setPasswordError('');
      Keyboard.dismiss();

      // Check for Permission (check if permission is already given or not)
      const isPermitedExternalStorage = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );

      if(!isPermitedExternalStorage) {
        // Ask for permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            message: '',
            buttonPositive: "OK",
            buttonNegative: "Cancel",
            buttonNeutral: "Ask Me Later",
            title: "Storage permission needed",
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // Permission Granted (calling our exportDataToExcel function)
          exportDataToExcel();
        } else {
          // Permission denied
          toast({
            type: 'warning',
            text: 'Permission denied',
          })
        }
      } else {
        // Already have Permission (calling our exportDataToExcel function)
        exportDataToExcel();
      }

    } catch(error) {
      console.log('Error while checking permission in ExportTx', error);
    }
  }

  return (
    <BgView>
      <HeaderCustom variant='back' title='Export transactions'/>
      <ViewContainer style={styles.viewContainer} >
        <TextInputCustom
          secureTextEntry
          value={password}
          autoCapitalize='none'
          errorMsg={passwordError}
          onChangeText={setPassword}
          label='Enter your password'
        />

        <View style={{ flex: 1 }} />

          <Button
            variant='grey'
            text='Download CSV'
            onPress={handleClick}
          />
      </ViewContainer>

    </BgView>
  )
}

export default ExportTx;

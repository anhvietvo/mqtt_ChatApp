import React, {Component} from 'react';
import {Text, View, StyleSheet, TextInput, FlatList} from 'react-native';
import {Button, Icon} from 'native-base';
import DeviceInfo from 'react-native-device-info';
import mqtt from './node_modules/mqtt/dist/mqtt';

const MessageView = (props) => {
  return (
    <View
      style={
        props.float === 'left' ? msgStyles.floatLeft : msgStyles.floatRight
      }>
      <View style={msgStyles.contentBox}>
        <Text
          style={
            props.float === 'left' ? msgStyles.msgLeft : msgStyles.msgRight
          }>
          {props.text}
        </Text>
      </View>
    </View>
  );
};

const msgStyles = StyleSheet.create({
  floatLeft: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  floatRight: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contentBox: {
    maxWidth: '80%',
  },
  msgLeft: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 8,
    fontSize: 15,
    fontWeight: '700',
  },
  msgRight: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 8,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '700',
  },
});

const renderItem = ({item}) => <MessageView {...item} />;

const TOPIC = 'hcmiuiot/chat';
export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      input: '',
      msg: [],
      isFormValid: false,
    };
  }

  componentDidMount() {
    this.deviceID = DeviceInfo.getUniqueId();
    // mqtt
    this.client = mqtt.connect('ws://broker.hivemq.com:8000/mqtt');
    this.client.on('connect', () => {
      console.log('MQTT connected');
      this.client.subscribe(TOPIC, function (err) {
        if (!err) {
          console.log('Subscribed OK!');
        }
      });
    });

    this.client.on('message', (topic, message) => {
      console.log(`[${topic}] ${message.toString()}`);

      let msgObj = JSON.parse(message);
      if (!msgObj || !msgObj.deviceID || !msgObj.text) {
        return;
      } else {
        this.setState({
          msg: [
            ...this.state.msg,
            {
              text: msgObj.text,
              float: msgObj.deviceID === this.deviceID ? 'right' : 'left',
            },
          ],
        });
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.input !== prevState.input) {
      this.validateForm();
    }
  }

  handdleInputMsg = (input) => {
    this.setState({input});
  };

  handdleSendMsg = () => {
    let text = this.state.input;
    this.client.publish(TOPIC, JSON.stringify({deviceID: this.deviceID, text}));
    this.setState({input: ''});
  };

  validateForm = () => {
    if (this.state.input.trim().length) {
      this.setState({isFormValid: true});
    } else {
      this.setState({isFormValid: false});
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <FlatList
          style={styles.msgView}
          renderItem={renderItem}
          data={this.state.msg}
          keyExtractor={(item, index) => index.toString()}
          ref={(ref) => (this.flatList = ref)}
          onContentSizeChange={() =>
            this.flatList.scrollToEnd({animated: true})
          }
          onLayout={() => this.flatList.scrollToEnd({animated: true})}
        />
        <View style={styles.msgInput}>
          <TextInput
            style={styles.input}
            value={this.state.input}
            onChangeText={this.handdleInputMsg}
            onSubmitEditing={this.handdleSendMsg}
          />
          <Button
            rounded
            info
            style={styles.btn}
            onPress={this.handdleSendMsg}
            disabled={!this.state.isFormValid}>
            <Icon
              type="FontAwesome"
              name="paper-plane"
              style={{color: 'white'}}
            />
          </Button>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ebe6ff',
    paddingTop: 10,
  },
  msgView: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  msgInput: {
    backgroundColor: '#47476b',
    flexDirection: 'row',
    padding: 10,
  },
  input: {
    borderRadius: 15,
    marginRight: 15,
    height: 40,
    flex: 8,
    backgroundColor: 'white',
    fontSize: 17,
  },
  btn: {
    flex: 3,
  },
  txt: {
    fontWeight: 'bold',
    fontSize: 20,
  },
});

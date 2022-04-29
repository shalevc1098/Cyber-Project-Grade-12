import React, { Component } from 'react';
import { Center, HStack } from 'native-base';
import { Login, LoginButton, Register, RegisterButton } from '../components';

class Authorization extends Component<{}, any> {
    constructor(props) {
        super(props);

        this.state = {
            page: <Login />
        }

        this.handleButtonPress = this.handleButtonPress.bind(this);
    }

    // Takes the pressed button text, checks if the pressed button is "Register" or "Login" and changes the page accordingly
    handleButtonPress(e) {
        const page = e.target.textContent ? e.target.textContent : e._dispatchInstances.memoizedProps.children[0]._owner.memoizedProps.children.props.children;
        if (page == "Register") this.setState({ page: <Register /> });
        else if (page == "Login") this.setState({ page: <Login /> });
    }

    // Clears the state once the app is closed/the client has registered or logged into an account
    componentWillUnmount() {
        this.setState({});
    }

    // Renders the page content
    render() {
        return (
            <>
                <Center p={5} style={{ borderBottomColor: 'gray', borderBottomWidth: 1 }}>
                    <HStack space={5} style={{
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'center'
                    }}>
                        <LoginButton handleButtonPress={this.handleButtonPress} />
                        <RegisterButton handleButtonPress={this.handleButtonPress} />
                    </HStack>
                </Center>
                {this.state.page}
            </>
        )
    }
}

export default Authorization;
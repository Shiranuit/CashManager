import 'dart:io';

import 'package:cash_manager/views/shopping_cart.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations(
      [DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cash Manager',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        colorScheme: const ColorScheme.dark(),
        // scaffoldBackgroundColor: Colors.black,
      ),
      home: const MyHomePage(title: 'Cash Manager'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key, required this.title}) : super(key: key);

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  bool rememberIP = false;
  bool rememberUserPassword = false;
  late TextEditingController _ipController;
  late TextEditingController _userController;
  late TextEditingController _passwordController;
  late ValueNotifier<bool> _waitingForLogin;

  @override
  void initState() {
    super.initState();
    _ipController = TextEditingController();
    _userController = TextEditingController();
    _passwordController = TextEditingController();
    _waitingForLogin = ValueNotifier(false);
  }

  @override
  void dispose() {
    _ipController.dispose();
    _userController.dispose();
    _passwordController.dispose();
    _waitingForLogin.dispose();
    super.dispose();
  }

  Future<bool> loadSettings() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    rememberIP = prefs.getBool('rememberIP') ?? false;
    rememberUserPassword = prefs.getBool('rememberUserPassword') ?? false;
    if (rememberIP) {
      _ipController.text = prefs.getString('ip') ?? '';
    }
    if (rememberUserPassword) {
      _userController.text = prefs.getString('username') ?? '';
      _passwordController.text = prefs.getString('password') ?? '';
    }
    return true;
  }

  Future<void> saveSettings() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    prefs.setBool('rememberIP', rememberIP);
    prefs.setBool('rememberUserPassword', rememberUserPassword);
    prefs.setString('ip', _ipController.text);
    if (rememberUserPassword) {
      prefs.setString('username', _userController.text);
      prefs.setString('password', _passwordController.text);
    }
  }

  showErrorMessage(String message) {
    SnackBar snackBar = SnackBar(
      content: Text(
        message,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      backgroundColor: Colors.red[300],
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  login() async {
    await saveSettings();

    var prefs = await SharedPreferences.getInstance();

    String? ip = prefs.getString('ip');

    if (ip != null) {
      try {
        _waitingForLogin.value = true;
        var response = await http.post(
          Uri.parse('http://$ip/api/auth/_login'),
          body: jsonEncode({
            'username': _userController.text,
            'password': _passwordController.text,
          }),
        );
        if (response.statusCode == 200) {
          var json = jsonDecode(response.body);
          if (json['error'] != null) {
            _waitingForLogin.value = false;
            showErrorMessage(json['error']['message']);
            return;
          }

          var result = json['result'];

          prefs.setString('jwt', result['jwt']);
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => const ShoppingCart(),
            ),
          );
        }
      } on SocketException catch (err) {
        _waitingForLogin.value = false;
        showErrorMessage(err.message);
        return;
      } catch (err) {
        var error = err as Error;
        _waitingForLogin.value = false;
        showErrorMessage(error.toString());
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              margin: const EdgeInsets.all(8.0),
              child: FutureBuilder<bool>(
                  future: loadSettings(),
                  builder: (context, snapshot) {
                    if (snapshot.hasError) {
                      return Center(
                        child: Text('Error: ${snapshot.error}'),
                      );
                    }

                    if (!snapshot.hasData) {
                      return const Center(
                        child: CircularProgressIndicator(),
                      );
                    }

                    return Card(
                      elevation: 8.0,
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.all(Radius.circular(16.0)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: ValueListenableBuilder(
                          valueListenable: _waitingForLogin,
                          builder: (context, bool waiting, child) {
                            return waiting
                                ? const CircularProgressIndicator()
                                : child!;
                          },
                          child: AutofillGroup(
                            child: Form(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceEvenly,
                                children: [
                                  TextFormField(
                                    decoration: const InputDecoration(
                                      icon: Icon(Icons.computer_outlined),
                                      labelText: 'Server IP address / Url',
                                      hintText:
                                          'IP Address / Url of the server',
                                    ),
                                    autofillHints: const [AutofillHints.url],
                                    controller: _ipController,
                                    onChanged: (value) {
                                      saveSettings();
                                    },
                                  ),
                                  TextFormField(
                                    decoration: const InputDecoration(
                                      icon: Icon(Icons.person_outline),
                                      labelText: 'Username',
                                      hintText: 'Username',
                                    ),
                                    autofillHints: const [
                                      AutofillHints.username
                                    ],
                                    controller: _userController,
                                    onChanged: (value) {
                                      if (rememberUserPassword) {
                                        saveSettings();
                                      }
                                    },
                                  ),
                                  TextFormField(
                                    decoration: const InputDecoration(
                                      icon: Icon(Icons.password_outlined),
                                      labelText: 'Password',
                                    ),
                                    autofillHints: const [
                                      AutofillHints.password
                                    ],
                                    obscureText: true,
                                    controller: _passwordController,
                                    onChanged: (value) {
                                      if (rememberUserPassword) {
                                        saveSettings();
                                      }
                                    },
                                  ),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Remember Server Address'),
                                      Switch(
                                          value: rememberIP,
                                          onChanged: (state) {
                                            setState(() {
                                              rememberIP = state;
                                              saveSettings();
                                            });
                                          }),
                                    ],
                                  ),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text(
                                          'Remember username and Password'),
                                      Switch(
                                          value: rememberUserPassword,
                                          onChanged: (state) {
                                            setState(() {
                                              rememberUserPassword = state;
                                              saveSettings();
                                            });
                                          }),
                                    ],
                                  ),
                                  ElevatedButton(
                                    onPressed: login,
                                    child: const Text('Login'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
            )
          ],
        ),
      ),
    );
  }
}

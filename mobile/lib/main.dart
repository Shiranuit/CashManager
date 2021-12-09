import 'package:cash_manager/views/shopping_cart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart';

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
  bool rememberEmailPassword = false;
  late TextEditingController _ipController;
  late TextEditingController _emailController;
  late TextEditingController _passwordController;
  late Future<bool> _settingLoading;

  @override
  void initState() {
    super.initState();
    _ipController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _settingLoading = loadSettings();
  }

  @override
  void dispose() {
    _ipController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<bool> loadSettings() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    rememberIP = prefs.getBool('rememberIP') ?? false;
    rememberEmailPassword = prefs.getBool('rememberEmailPassword') ?? false;
    if (rememberIP) {
      _ipController.text = prefs.getString('ip') ?? '';
    }
    if (rememberEmailPassword) {
      _emailController.text = prefs.getString('email') ?? '';
      _passwordController.text = prefs.getString('password') ?? '';
    }
    return true;
  }

  Future<void> saveSettings() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    prefs.setBool('rememberIP', rememberIP);
    prefs.setBool('rememberEmailPassword', rememberEmailPassword);
    prefs.setString('ip', _ipController.text);
    if (rememberEmailPassword) {
      prefs.setString('email', _emailController.text);
      prefs.setString('password', _passwordController.text);
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
                        child: AutofillGroup(
                          child: Form(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                TextFormField(
                                  decoration: const InputDecoration(
                                    icon: Icon(Icons.computer_outlined),
                                    labelText: 'Server IP address / Url',
                                    hintText: 'IP Address / Url of the server',
                                  ),
                                  autofillHints: const [AutofillHints.url],
                                  controller: _ipController,
                                  onChanged: (value) {
                                    saveSettings();
                                  },
                                ),
                                TextFormField(
                                  decoration: const InputDecoration(
                                    icon: Icon(Icons.email_outlined),
                                    labelText: 'Email',
                                    hintText: 'Email Address',
                                  ),
                                  autofillHints: const [
                                    AutofillHints.email,
                                    AutofillHints.username
                                  ],
                                  controller: _emailController,
                                  onChanged: (value) {
                                    if (rememberEmailPassword) {
                                      saveSettings();
                                    }
                                  },
                                ),
                                TextFormField(
                                  decoration: const InputDecoration(
                                    icon: Icon(Icons.password_outlined),
                                    labelText: 'Password',
                                  ),
                                  autofillHints: const [AutofillHints.password],
                                  obscureText: true,
                                  controller: _passwordController,
                                  onChanged: (value) {
                                    if (rememberEmailPassword) {
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
                                    const Text('Remember Email and Password'),
                                    Switch(
                                        value: rememberEmailPassword,
                                        onChanged: (state) {
                                          setState(() {
                                            rememberEmailPassword = state;
                                            saveSettings();
                                          });
                                        }),
                                  ],
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    saveSettings().then(
                                      (value) => {
                                        Navigator.pushReplacement(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                ShoppingCart(),
                                          ),
                                        ),
                                      },
                                    );
                                  },
                                  child: const Text('Login'),
                                ),
                              ],
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

import 'dart:async';
import 'dart:math';
import 'dart:convert';
import 'package:http/http.dart' as http;

import 'package:cash_manager/components/animated_expander.dart';
import 'package:cash_manager/components/barcode_scanner.dart';
import 'package:cash_manager/components/nfc_scanner.dart';
import 'package:cash_manager/components/order_receipt.dart';
import 'package:cash_manager/models/product.dart';
import 'package:flutter/material.dart';
import 'package:cash_manager/enums/paiement_method.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PaymentView extends StatefulWidget {
  final List<Product> products;
  PaymentView({
    Key? key,
    required this.products,
  }) : super(key: key);

  @override
  _PaymentViewState createState() => _PaymentViewState();
}

class _PaymentViewState extends State<PaymentView> {
  late ValueNotifier<PaiementMethod> _paiementMethod;
  late ValueNotifier<bool> _shoppingCartPaid;
  bool showQRScanner = false;
  bool showNFCScanner = false;
  late StreamController<bool> _expandQRScannerController;
  late StreamController<bool> _expandNFCScannerController;

  @override
  void initState() {
    super.initState();
    _expandQRScannerController = StreamController();
    _expandNFCScannerController = StreamController();
    _paiementMethod = ValueNotifier(PaiementMethod.none);
    _shoppingCartPaid = ValueNotifier(false);
  }

  @override
  void dispose() {
    _expandQRScannerController.close();
    _expandNFCScannerController.close();
    _paiementMethod.dispose();
    _shoppingCartPaid.dispose();
    super.dispose();
  }

  Widget buildPaymentMethodSelector() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Expanded(
          child: Center(
            child: Text(
              'How would you like to pay?',
              style: TextStyle(fontSize: 18),
            ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 50,
                child: ValueListenableBuilder(
                  valueListenable: _paiementMethod,
                  builder: (BuildContext context, PaiementMethod value,
                      Widget? child) {
                    return ElevatedButton(
                      onPressed: () {
                        if (_paiementMethod.value == PaiementMethod.nfc) {
                          _paiementMethod.value = PaiementMethod.none;
                          _expandNFCScannerController.add(!showNFCScanner);
                          return;
                        }
                        _paiementMethod.value = PaiementMethod.nfc;
                        setState(() {
                          showQRScanner = false;
                        });
                        _expandQRScannerController.add(false);
                        _expandNFCScannerController.add(!showNFCScanner);
                      },
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.contactless_outlined,
                            color: value == PaiementMethod.nfc
                                ? Colors.black
                                : Colors.white,
                            size: 36,
                          ),
                          Text(
                            'NFC',
                            style: TextStyle(
                              color: value == PaiementMethod.nfc
                                  ? Colors.black
                                  : Colors.white,
                              fontSize: 24,
                            ),
                          ),
                        ],
                      ),
                      style: ElevatedButton.styleFrom(
                        elevation: 0,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.only(
                            bottomLeft: Radius.circular(16),
                          ),
                        ),
                        primary: value == PaiementMethod.nfc
                            ? Theme.of(context).buttonTheme.colorScheme?.primary
                            : Colors.black.withOpacity(0.2),
                      ),
                    );
                  },
                ),
              ),
            ),
            Expanded(
              child: SizedBox(
                height: 50,
                child: ValueListenableBuilder(
                  valueListenable: _paiementMethod,
                  builder: (BuildContext context, PaiementMethod value,
                      Widget? child) {
                    return ElevatedButton(
                      onPressed: () {
                        if (_paiementMethod.value == PaiementMethod.scan) {
                          _paiementMethod.value = PaiementMethod.none;
                          _expandQRScannerController.add(!showQRScanner);
                          return;
                        }
                        _paiementMethod.value = PaiementMethod.scan;
                        setState(() {
                          showNFCScanner = false;
                        });
                        _expandNFCScannerController.add(false);
                        _expandQRScannerController.add(!showQRScanner);
                      },
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.qr_code,
                            color: value == PaiementMethod.scan
                                ? Colors.black
                                : Colors.white,
                            size: 36,
                          ),
                          Text(
                            'Scan',
                            style: TextStyle(
                              color: value == PaiementMethod.scan
                                  ? Colors.black
                                  : Colors.white,
                              fontSize: 24,
                            ),
                          ),
                        ],
                      ),
                      style: ElevatedButton.styleFrom(
                        elevation: 0,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.only(
                            bottomRight: Radius.circular(16),
                          ),
                        ),
                        primary: value == PaiementMethod.scan
                            ? Theme.of(context).buttonTheme.colorScheme?.primary
                            : Colors.black.withOpacity(0.2),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        )
      ],
    );
  }

  Widget buildBottomBar() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: SizedBox(
        height: 100,
        child: Card(
          elevation: 8,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: ValueListenableBuilder(
            valueListenable: _shoppingCartPaid,
            builder: (context, bool paid, Widget? child) {
              if (!paid) {
                return buildPaymentMethodSelector();
              }

              return Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(
                    Icons.check_circle_outline,
                    color: Colors.green,
                    size: 36,
                  ),
                  Text(
                    'Already Paid',
                    style: TextStyle(fontSize: 24, color: Colors.green),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
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

  FutureOr<bool> PayProducts(String accountId, String vcc) async {
    var prefs = await SharedPreferences.getInstance();
    String? ip = prefs.getString('ip');
    String? jwt = prefs.getString('jwt');

    if (ip != null && jwt != null) {
      try {
        var response = await http.post(
          Uri.parse('http://$ip/api/product/pay'),
          headers: {
            'Authorization': jwt,
          },
          body: jsonEncode({
            'accountId': accountId,
            'vcc': vcc,
            'products': widget.products
                .map(
                  (e) => {
                    'code': e.code,
                    'quantity': e.quantity,
                  },
                )
                .toList(),
          }),
        );
        if (response.statusCode == 200) {
          var json = jsonDecode(response.body);
          if (json['error'] != null) {
            showErrorMessage(json['error']['message']);
            return false;
          }

          _shoppingCartPaid.value = true;
          return true;
        }
      } catch (err) {
        var error = err as Error;
        showErrorMessage(error.toString());
        return true;
      }
    }

    return false;
  }

  afterPaymentSucceeded() {
    _expandNFCScannerController.add(false);
    _expandQRScannerController.add(false);
  }

  Widget buildBarcodeScanner() {
    return AnimatedExpander(
      onCollapsed: () {
        setState(() {
          showQRScanner = false;
        });
      },
      onExpanded: () {
        setState(() {
          showQRScanner = true;
        });
      },
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BarCodeScanner(
            onScan: (barcode) async {
              if (barcode.format != BarcodeFormat.qrcode) {
                return false;
              }

              String? code = barcode.code;

              if (code == null) {
                return false;
              }

              List<String> data = code.split(',');

              if (data.length < 2) {
                return false;
              }

              return await PayProducts(data[0], data[1]);
            },
            scanDelay: const Duration(milliseconds: 1000),
          ),
        ),
      ),
      expansionChild: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: Colors.black,
      ),
      duration: const Duration(milliseconds: 250),
      listenable: _expandQRScannerController.stream,
      defaultExpanded: false,
      width: MediaQuery.of(context).size.width,
      height: MediaQuery.of(context).size.height / 2.5,
    );
  }

  Widget buildNFCScanner() {
    return AnimatedExpander(
      onCollapsed: () {
        setState(() {
          showNFCScanner = false;
        });
      },
      onExpanded: () {
        setState(() {
          showNFCScanner = true;
        });
      },
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: NFCScanner(
            onScan: (String str) async {
              List<String> data = str.split(',');

              if (data.length < 2) {
                return false;
              }

              return await PayProducts(data[0], data[1]);
            },
            afterSuccessAnimation: afterPaymentSucceeded,
          ),
        ),
      ),
      useChildAsExpansion: true,
      onRebuild: (context, widget) {
        return FittedBox(
          child: widget,
          fit: BoxFit.contain,
        );
      },
      duration: const Duration(milliseconds: 250),
      listenable: _expandNFCScannerController.stream,
      defaultExpanded: false,
      width: MediaQuery.of(context).size.width,
      height: MediaQuery.of(context).size.height / 2.5,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
      ),
      body: WillPopScope(
        onWillPop: () async {
          Navigator.pop<bool>(context, _shoppingCartPaid.value);
          return false;
        },
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: SingleChildScrollView(
            child: Column(
              children: [
                buildNFCScanner(),
                buildBarcodeScanner(),
                OrderReceipt(products: widget.products),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: buildBottomBar(),
    );
  }
}

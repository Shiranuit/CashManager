import 'package:cash_manager/models/product.dart';
import 'package:flutter/material.dart';

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
  DataTable buildProductResume() {
    List<DataRow> rows = [];

    for (Product product in widget.products) {
      rows.add(
        DataRow(cells: [
          DataCell(
            Text(
              product.name ?? 'Unkwnown <${product.code}>',
              style: const TextStyle(
                fontSize: 36,
              ),
            ),
          ),
          DataCell(
            Text(
              product.quantity.toString(),
              style: const TextStyle(
                fontSize: 36,
              ),
            ),
          ),
          DataCell(
            Text(
              '${product.price.toStringAsFixed(2)}€',
              style: const TextStyle(
                fontSize: 36,
              ),
            ),
          ),
          DataCell(
            Text(
              '${(product.quantity * product.price).toStringAsFixed(2)}€',
              style: const TextStyle(
                fontSize: 36,
              ),
            ),
          )
        ]),
      );
    }

    return DataTable(
      sortColumnIndex: 3,
      sortAscending: false,
      columns: const [
        DataColumn(
          label: Text(
            'Product',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 36,
            ),
          ),
        ),
        DataColumn(
          label: Text(
            'Quantity',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 36,
            ),
          ),
        ),
        DataColumn(
          label: Text(
            'Unit',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 36,
            ),
          ),
        ),
        DataColumn(
          label: Text(
            'Total',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 36,
            ),
          ),
        )
      ],
      rows: rows,
    );
  }

  Widget buildTotal() {
    int totalQuantity = 0;
    double totalPrice = 0;

    for (var product in widget.products) {
      totalPrice += product.price * product.quantity;
      totalQuantity = product.quantity;
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        Column(
          children: [
            Text(
              'Products',
              style: Theme.of(context).textTheme.headline6,
            ),
            Text(
              totalQuantity.toString(),
              style: Theme.of(context).textTheme.headline6,
            ),
          ],
        ),
        Column(
          children: [
            Text(
              'Total',
              style: Theme.of(context).textTheme.headline6,
            ),
            Text(
              '${totalPrice.toStringAsFixed(2)}€',
              style: Theme.of(context).textTheme.headline6,
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            SingleChildScrollView(
              child: Card(
                elevation: 8,
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Order Receipt',
                          style: Theme.of(context).textTheme.headline6),
                      const SizedBox(
                        height: 20,
                      ),
                      InteractiveViewer(
                        child: ConstrainedBox(
                          constraints: BoxConstraints(
                            minHeight: MediaQuery.of(context).size.height * 0.3,
                          ),
                          child: FittedBox(
                            alignment: Alignment.topLeft,
                            child: buildProductResume(),
                          ),
                        ),
                      ),
                      Column(
                        children: [
                          const Divider(
                            thickness: 4,
                          ),
                          buildTotal(),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

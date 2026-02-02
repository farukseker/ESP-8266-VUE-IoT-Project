## ESP (Panel) kurulumu için

```sh
bun i
```

## Eğer ESP (Panel) geliştirmek isterseniz

```sh
bun run dev
```

## ESP Build (Panel)

ESP üzerinde çalışacak panel için **özel build** alınması gerekir.


### ESP için Build Alma

ESP’ye yüklenecek arayüzü üretmek için aşağıdaki komut kullanılmalıdır:

```sh
bun run build:esp
```

Bu komut sonucunda bir **`dist/`** klasörü oluşur.

### Arduino / ESP Tarafı

ESP tarafında dosya sistemi (LittleFS veya SPIFFS) kullanıldığı için:

* Oluşan **`dist/` klasörü**
* **Arduino projesindeki `data/` klasörünün içine** kopyalanmalıdır

Örnek yapı:

```text
esp-project/
 ├─ esp-project.ino
 └─ data/
     ├─ index.html
     ├─ assets/
     └─ favicon.ico
```

> Not: `dist/` içeriği doğrudan `data/` altına kopyalanmalıdır, `data/dist` şeklinde olmamalıdır.

### Dosyaları ESP’ye Yükleme

Kullandığın Arduino IDE sürümüne göre uygun uploader ile `data/` klasörünü ESP’ye yükle:

* Arduino IDE 1.x

  * ESP8266 LittleFS Data Upload
* Arduino IDE 2.x

  * arduino-littlefs-upload (Command Palette üzerinden)

Yükleme tamamlandıktan sonra ESP, panel dosyalarını doğrudan dosya sisteminden servis eder.


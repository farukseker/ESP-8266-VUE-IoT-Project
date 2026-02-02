# ESP8266 / LittleFS & SPIFFS Upload Tools – README

Bu doküman, ESP8266 projelerinde **SPIFFS** ve **LittleFS** dosya sistemlerini kullanmak için gerekli Arduino eklentilerinin **hangi Arduino IDE sürümleriyle** kurulması gerektiğini açıklar.

## İçerik

* Arduino IDE 1.x için SPIFFS
* Arduino IDE 1.x için LittleFS
* Arduino IDE 2.x için LittleFS
* Hangi IDE’de hangisi kullanılmalı (özet tablo)

---

## 1. arduino-esp8266fs-plugin (SPIFFS)

**Repository**
[https://github.com/esp8266/arduino-esp8266fs-plugin/releases](https://github.com/esp8266/arduino-esp8266fs-plugin/releases)

### Amaç

ESP8266 üzerinde **SPIFFS** dosya sistemine `data/` klasöründeki dosyaları yüklemek için kullanılır.

### Uyumlu Arduino IDE Sürümleri

* Arduino IDE 1.x

  * Özellikle **1.6.x – 1.8.x**
* Arduino IDE 2.x **desteklenmez**

### Notlar

* Bu plugin eski ve **bakımı yapılmıyor**
* Yeni projelerde SPIFFS yerine **LittleFS önerilir**
* Menüde **Tools → ESP8266 Sketch Data Upload** olarak görünür

---

## 2. arduino-esp8266littlefs-plugin (LittleFS – IDE 1.x)

**Repository**
[https://github.com/earlephilhower/arduino-esp8266littlefs-plugin/releases](https://github.com/earlephilhower/arduino-esp8266littlefs-plugin/releases)

### Amaç

ESP8266 için **LittleFS** dosya sistemi uploader’ı (SPIFFS’in yerine geçer).

### Uyumlu Arduino IDE Sürümleri

* Arduino IDE 1.x

  * **1.8.x** en stabil sürümdür
* Arduino IDE 2.x **desteklenmez**

### Gerekli Şartlar

* ESP8266 Board Package yüklü olmalı
* Core sürümü LittleFS desteklemeli (**2.6.0+**)

### Notlar

* Menüde **Tools → ESP8266 LittleFS Data Upload** olarak görünür
* IDE 1.x kullanıyorsan **en doğru seçim budur**

---

## 3. arduino-littlefs-upload (LittleFS – IDE 2.x)

**Repository**
[https://github.com/earlephilhower/arduino-littlefs-upload](https://github.com/earlephilhower/arduino-littlefs-upload)

### Amaç

Arduino IDE 2.x için modern **LittleFS uploader**.
ESP8266, ESP32 ve diğer platformları destekler.

### Uyumlu Arduino IDE Sürümleri

* Arduino IDE **2.2.1 ve üzeri**
* Arduino IDE 1.x **desteklenmez**

### Çalışma Şekli

* IDE 2.x içinde **Command Palette** kullanır
* Menü yerine komut tabanlıdır

### Notlar

* IDE 2.x kullanıyorsan **tek doğru çözüm**
* SPIFFS desteği yok, yalnızca LittleFS

---

## Karşılaştırma Tablosu

| Plugin                         | Dosya Sistemi | Arduino IDE 1.x | Arduino IDE 2.x |
| ------------------------------ | ------------- | --------------- | --------------- |
| arduino-esp8266fs-plugin       | SPIFFS        | Var             | Yok             |
| arduino-esp8266littlefs-plugin | LittleFS      | Var             | Yok             |
| arduino-littlefs-upload        | LittleFS      | Yok             | Var (2.2.1+)    |

---

## Önerilen Kullanım

* **Arduino IDE 1.8.x kullanıyorsan**

  * `arduino-esp8266littlefs-plugin`
* **Arduino IDE 2.x kullanıyorsan**

  * `arduino-littlefs-upload`
* Yeni projelerde **SPIFFS kullanma**, **LittleFS tercih et**

---

## Klasör Yapısı (Tüm Araçlar İçin Ortak)

```text
project/
 ├─ project.ino
 └─ data/
     ├─ index.html
     ├─ favicon.ico
     └─ assets/
```

`data/` klasörü upload edildiğinde doğrudan dosya sistemine yazılır.

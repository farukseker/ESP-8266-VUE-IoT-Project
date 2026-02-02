#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
// #include <ESP8266WebServerSecure.h>
#include <FS.h>
#include <LittleFS.h>
#include "secret.h"
// #include "cert.h"
// #include "key.h"

#define LAMP_PIN D1
#define HAND_CONTROL_PIN D5 
#define ERROR_LED_PIN D7

ESP8266WebServer server(80);
// BearSSL::ESP8266WebServerSecure server(443);

bool lampState = false;
bool timerActive = false;
bool lockHandControl = false;
unsigned long timerEnd = 0;

void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void lampOn() {
  pinMode(LAMP_PIN, OUTPUT);
  digitalWrite(LAMP_PIN, LOW);
  lampState = true;
}

void lampOff() {
  pinMode(LAMP_PIN, INPUT); 
  digitalWrite(LAMP_PIN, HIGH);
  lampState = false;
}
String logBuffer = "";
const int MAX_LOG_LINES = 50;

void logMessage(String msg) {
  Serial.println(msg);
  
  logBuffer += msg + "\n";
  
  int lineCount = 0;
  for (int i = 0; i < logBuffer.length(); i++) {
    if (logBuffer[i] == '\n') lineCount++;
  }
  
  while (lineCount > MAX_LOG_LINES) {
    int firstNewline = logBuffer.indexOf('\n');
    if (firstNewline != -1) {
      logBuffer = logBuffer.substring(firstNewline + 1);
      lineCount--;
    } else break;
  }
}

String getContentType(String filename) {
  if (filename.endsWith(".html")) return "text/html; charset=UTF-8";
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".json")) return "application/json";
  else if (filename.endsWith(".png")) return "image/png";
  else if (filename.endsWith(".jpg")) return "image/jpeg";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  else if (filename.endsWith(".svg")) return "image/svg+xml";
  return "text/plain";
}

bool handleFileRead(String path) {
  logMessage("Request: " + path);

  // index.html for Root path
  if (path == "/" || path == "") {
    path = "/index.html";
  }

  // file patch
  if (LittleFS.exists(path)) {
    File file = LittleFS.open(path, "r");
    if (file) {
      String contentType = getContentType(path);
      server.sendHeader("Cache-Control", "max-age=3600");
      
      server.sendHeader("Content-Encoding", ""); // ← Boş!
      
      server.streamFile(file, contentType);
      file.close();
      logMessage("Served: " + path + " (Type: " + contentType + ")");
      return true;
    }
  }

  logMessage("Not found: " + path);
  server.send(404, "text/html", "<h1>404 Not Found</h1>");
  return false;
}


void setup() {
  Serial.begin(115200);
  
  // server.getServer().setRSACert(
  //   new BearSSL::X509List(cert_pem, cert_pem_len),
  //   new BearSSL::PrivateKey(key_pem, key_pem_len)
  // );

  pinMode(LAMP_PIN, OUTPUT); 
  lampOff();
  pinMode(HAND_CONTROL_PIN, INPUT_PULLUP);
  pinMode(ERROR_LED_PIN, OUTPUT);
  
  IPAddress ip(192,168,123,250);
  IPAddress gw(192,168,123,1);
  IPAddress mask(255,255,255,0);

  WiFi.config(ip, gw, mask);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }

  if (!LittleFS.begin()) {
    digitalWrite(ERROR_LED_PIN, HIGH);
    Serial.println("LittleFS Mount Failed");
  } else {
    digitalWrite(ERROR_LED_PIN, LOW);
    Serial.println("LittleFS Mounted");
  }

  server.on("/lock", HTTP_GET, []() {
    sendCORS();
    lockHandControl = true;
    server.send(200, "application/json", "{\"lock\":true}");
  });

  server.on("/unlock", HTTP_GET, []() {
    sendCORS();
    lockHandControl = false;
    server.send(200, "application/json", "{\"lock\":false}");
  });

  server.on("/lockstatus", HTTP_GET, []() {
    sendCORS();
    String res = "{\"lock\":" + String(lockHandControl ? "true" : "false") + "}";
    server.send(200, "application/json", res);
  });

  server.on("/lamp/on", HTTP_GET, []() {
    sendCORS();
    timerActive = false;
    lampOn();
    server.send(200, "application/json", "{\"lamp\":\"on\"}");
  });

  server.on("/lamp/off", HTTP_GET, []() {
    sendCORS();
    timerActive = false;
    lampOff();
    server.send(200, "application/json", "{\"lamp\":\"off\"}");
  });

  server.on("/lamp/status", HTTP_GET, []() {
    sendCORS();
    unsigned long remaining = (timerActive && millis() < timerEnd) ? (timerEnd - millis()) / 1000 : 0;
    String res = "{\"lamp\":\"" + String(lampState ? "on" : "off") + "\",\"timerActive\":" + (timerActive ? "true" : "false") + ",\"remainingSeconds\":" + String(remaining) + "}";
    server.send(200, "application/json", res);
  });

  server.on("/lamp/timer", HTTP_OPTIONS, []() {
    sendCORS();
    server.send(204); // no content
  });
  server.on("/lamp/timer", HTTP_POST, []() {
    sendCORS();
    if (server.hasArg("plain")) {
      String body = server.arg("plain");
      int seconds = body.substring(body.indexOf(":") + 1).toInt();
      if (seconds > 0) {
        lampOn();
        timerActive = true;
        timerEnd = millis() + (unsigned long)seconds * 1000;
        server.send(200, "application/json", "{\"timer\":\"started\"}");
        return;
      }
    }
    server.send(400, "application/json", "{\"error\":\"invalid request\"}");
  });

    server.on("/system/info", HTTP_GET, []() {
    sendCORS();
    
    FSInfo fs_info;
    LittleFS.info(fs_info);
    
    String json = "{";
    json += "\"flashSize\":" + String(ESP.getFlashChipSize());
    json += ",\"freeHeap\":" + String(ESP.getFreeHeap());
    json += ",\"sketchSize\":" + String(ESP.getSketchSize());
    json += ",\"freeSketchSpace\":" + String(ESP.getFreeSketchSpace());
    json += ",\"littleFSTotal\":" + String(fs_info.totalBytes);
    json += ",\"littleFSUsed\":" + String(fs_info.usedBytes);
    json += ",\"littleFSFree\":" + String(fs_info.totalBytes - fs_info.usedBytes);
    json += "}";
    
    server.send(200, "application/json", json);
  });



// LOG ENDPOINT
  server.on("/system/logs", HTTP_GET, []() {
    sendCORS();
    server.send(200, "text/plain", logBuffer);
  });
  
  // FILES ENDPOINT
  server.on("/system/files", HTTP_GET, []() {
    sendCORS();
    
    String result = "";
    Dir dir = LittleFS.openDir("/");
    
    while (dir.next()) {
      result += dir.fileName();
      result += " (" + String(dir.fileSize()) + " bytes)\n";
    }
    
    server.send(200, "text/plain", result);
  });
  
  logMessage("ESP8266 started - IP: " + WiFi.localIP().toString());



  server.onNotFound([]() {
    if (!handleFileRead(server.uri())) {
      if (!server.uri().startsWith("/api") && !server.uri().startsWith("/system")) {
        handleFileRead("/index.html");
      } else {
        server.send(404, "application/json", "{\"error\":\"Not Found\"}");
      }
    }
  });


  server.begin();
}

void loop() {
  server.handleClient();

  if (timerActive && millis() >= timerEnd) {
    lampOff();
    timerActive = false;
  }

  if (digitalRead(HAND_CONTROL_PIN) == LOW && !lockHandControl) { 
    if (lampState) lampOff(); else lampOn();
    delay(500); // Debounce
  }
}
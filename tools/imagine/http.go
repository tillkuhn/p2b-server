package main

// https://astaxie.gitbooks.io/build-web-application-with-golang/content/en/04.5.html
// https://nesv.github.io/golang/2014/02/25/worker-queues-in-go.html
import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/rs/xid"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func getEntityObjectList(w http.ResponseWriter, r *http.Request) {
	entityType, entityId := extractEntityVars(r)
	prefix := fmt.Sprintf("%s%s/%s", config.S3Prefix, entityType, entityId)
	lr, _ := s3Handler.GetAllObjectsForId(prefix)
	json, err2 := json.Marshal(lr)
	if err2 != nil {
		http.Error(w, err2.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(json)
	w.Header().Set("Content-Type", "application/json")
}

func presignUrl(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	item := vars["item"]
	entityType, entityId := extractEntityVars(r)
	key := fmt.Sprintf("%s%s/%s/%s", config.S3Prefix, entityType, entityId, item)
	log.Printf("Presigning key %s", key)
	url := s3Handler.GetS3PresignedUrl(key)
	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(url))
}

// receive file from http request, dump to local storage first
func uploadToTmp(w http.ResponseWriter, r *http.Request) {
	entityType, entityId := extractEntityVars(r)
	log.Printf("method: %v path: %v entityType: %v id %v\\", r.Method, r.URL.Path, entityType, entityId)
	r.ParseMultipartForm(32 << 20)
	uploadFile, handler, err := r.FormFile(config.Fileparam)
	if err != nil {
		fmt.Println("error looking for", config.Fileparam, err)
		return
	}
	defer uploadFile.Close()
	fmt.Fprintf(w, "%v", handler.Header)
	localFilename := filepath.Join(config.Dumpdir, handler.Filename)
	f, err := os.OpenFile(localFilename, os.O_WRONLY|os.O_CREATE, 0666)
	if err != nil {
		fmt.Println(err)
		return
	}
	fStat, err := f.Stat()
	if err != nil {
		// Could not obtain stat, handle error
	}
	fSize := fStat.Size()

	defer f.Close()
	io.Copy(f, uploadFile)
	log.Printf("Uploaded %s dumped to temp storage %s", handler.Filename, localFilename)

	// Push the uploadReq onto the queue.
	uploadReq := UploadRequest{
		LocalPath: localFilename,
		Key:       fmt.Sprintf("%s%s/%s/%s", config.S3Prefix, entityType, entityId, handler.Filename),
		Size:      fSize,
		RequestId: xid.New().String(),
	}

	// Push the uploadReq onto the queue.
	uploadQueue <- uploadReq
	log.Printf("Work request queued for %s", localFilename)

	// And let the user know their uploadReq request was created.
	// w.WriteHeader(http.StatusCreated)
	//uploadToS3(localFilename)

	// create tumbnail from image and also upload
	//thumbnail := createThumbnail(localFilename)
	//uploadToS3(thumbnail)

	w.Header().Set("Content-Type", "application/json")
	status, err := json.Marshal(uploadReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(status)
}

func extractEntityVars(r *http.Request) (entityType string, entityId string) {
	vars := mux.Vars(r)
	return vars["entityType"], vars["entityId"]
}

func apiGet(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(" API endpoint ")
}

// A very simple health check.
func health(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	status, err := json.Marshal(map[string]interface{}{
		"status": "up",
		"info":   fmt.Sprintf("%s is healthy", appPrefix),
		"time":   time.Now().Format(time.RFC3339),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(status)
}

//if r.Method == "GET" {
//crutime := time.Now().Unix()
//h := md5.New()
//io.WriteString(h, strconv.FormatInt(crutime, 10))
//token := fmt.Sprintf("%x", h.Sum(nil))
//
//t, _ := template.ParseFiles("upload.gtpl")
//t.Execute(w, token)
//} else {

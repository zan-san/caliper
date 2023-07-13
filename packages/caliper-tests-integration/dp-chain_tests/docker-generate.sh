
node_num=64
file_name=config_$node_num/docker-compose.yaml

echo 'version: "3"' >> $file_name

echo '
services:
  booter:
    image: zansan/dper:0.9
    stdin_open: true
    working_dir: /
    volumes:
      - ./dper_booter1:/data
      - ./perpare.sh:/data/perpare.sh
    container_name: booter
    command: /data/perpare.sh
    network_mode: host '>> $file_name

for ((i=1; i<=node_num; i++)); do
  echo "  node$i:
    image: zansan/dper:0.9
    working_dir: /
    volumes:
      - ./dper_dper$i:/data
      - ./perpare.sh:/data/perpare.sh
    container_name: node$i
    command: /data/perpare.sh
    depends_on:
      - booter
    network_mode: host " >> $file_name
done
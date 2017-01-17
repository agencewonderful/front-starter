<?php
/**
 * Created by PhpStorm.
 * User: jeremydesvaux
 * Date: 27/12/2016
 * Time: 12:43
 */
error_reporting(E_ALL);
ini_set('display_errors','On');
$version = file_exists('version.php') ? include "version.php" : null;
include "autoload.php";
include "pages/header.php";
include "pages/home.php";
include "pages/footer.php";